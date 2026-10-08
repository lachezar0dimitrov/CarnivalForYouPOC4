import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { AwsClient } from "npm:aws4fetch@1.0.20";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ALLOWED_FOLDERS = new Set(["product-images", "banner-images", "category-images", "content-images"]);
const MAX_FILE_BYTES = 15 * 1024 * 1024;

// Public bases a stored media URL may legitimately use. R2_PUBLIC_URL is the
// one new uploads are written with; this list is what DELETE will still
// recognise. The bucket got a custom domain (img.carnivalforyou.com) on
// 2026-09-16 while every existing row still pointed at the r2.dev
// development URL, so accepting only the current R2_PUBLIC_URL would have
// made the admin panel unable to delete any image uploaded before the
// switch — and would have done it silently, as a 400 on an existing row.
// Both stay accepted until every stored URL is on the custom domain and the
// r2.dev public URL is actually turned off; only then is dropping the legacy
// entry safe.
const LEGACY_PUBLIC_BASES = ["https://pub-e3f62979b75f4bce8005a776ca5b4129.r2.dev"];

function publicHostsFrom(currentBase: string) {
  const hosts = new Set<string>();
  for (const base of [currentBase, ...LEGACY_PUBLIC_BASES]) {
    try {
      hosts.add(new URL(base).host);
    } catch {
      // a malformed base simply contributes no host
    }
  }
  return hosts;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extFromName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext && /^[a-z0-9]{1,5}$/.test(ext) ? ext : "bin";
}

// Folders that only ever hold opaque photos (verified against how each is
// rendered: CategoryGrid/ProductCard/BannerCarousel all draw these into
// object-cover/object-contain boxes on a solid card background — nothing
// here depends on PNG transparency). content-images (About/Services/News)
// isn't included since that one can plausibly hold a graphic that does need
// an alpha channel, and none of it showed up as an oversized outlier the way
// category/product/banner photos did.
const PHOTO_FOLDERS = new Set(["product-images", "banner-images", "category-images"]);

// The longest a photo's largest dimension needs to be at any of this site's
// display sizes (banner-images' own box tops out at 1920px wide; every
// other photo folder renders into a grid card far smaller than that), so
// this is a ceiling well above anything the site can actually show, not a
// visible-quality tradeoff. What it does fix: an admin's source photo
// arriving at whatever resolution their camera/export happened to produce
// (one live category tile was found at 1844x2304, 465KB, displayed at a
// few hundred px wide) with no resizing step in between, ever, before this.
// Re-encoding as JPEG on top of that catches the same waste PNG banners
// had (lossless compression on a photograph) for these folders generally.
// Best-effort: any decode/encode failure just uploads the original bytes
// unchanged rather than blocking the upload.
const MAX_PHOTO_DIMENSION = 2200;
const PHOTO_JPEG_QUALITY = 85;

// Site/print split (2026-09-29): product photos feed BOTH the website and
// the print catalog. The catalog needs every source pixel, the site never
// renders a product photo above ~600px (x2 for retina). So a product upload
// now stores the untouched original (-> products.print_image_url, used only
// by print-catalog/generate_print_catalog.py) plus a small web derivative
// under product-images/web/ (-> products.image_url). Category tiles have no
// print use, so they just get the smaller web ceiling directly.
const WEB_MAX_DIMENSION: Record<string, number> = {
  "product-images": 1200,
  "category-images": 1000,
};
const WEB_JPEG_QUALITY = 80;

// Site product photos are 3:4 (ProductCard draws them object-contain in a
// fixed frame). Supplier photos often arrive cropped tight to the costume
// (w/h as low as 0.35) and then look zoomed-in next to their neighbours, which
// twice needed a batch fix (image-pipeline/normalize_aspect_2026_09_29.py,
// same rules as here). So the web copy is padded -- never cropped -- to 3:4
// with the photo's own corner colour. 0.707 (A4 scans) is close enough and is
// left alone. The print original is untouched; the catalog does its own fit.
const WEB_ASPECT = 3 / 4;
const WEB_ASPECT_MIN = 0.7;
const WEB_ASPECT_MAX = 0.8;

function isSiteAspect(w: number, h: number) {
  return w / h >= WEB_ASPECT_MIN && w / h <= WEB_ASPECT_MAX;
}

function siteAspectCanvas(w: number, h: number): [number, number] {
  return w / h < WEB_ASPECT ? [Math.round(h * WEB_ASPECT), h] : [w, Math.round(w / WEB_ASPECT)];
}

// Median of small corner patches, flattened onto white the same way the
// photo itself is; near-white snaps to pure white.
function cornerBackground(img: Image): number {
  const { width: w, height: h, bitmap } = img;
  const k = Math.min(w, h, Math.max(4, Math.floor(Math.min(w, h) / 50)));
  const channels: number[][] = [[], [], []];
  for (const [x0, y0] of [[0, 0], [w - k, 0], [0, h - k], [w - k, h - k]]) {
    for (let y = y0; y < y0 + k; y++) {
      for (let x = x0; x < x0 + k; x++) {
        const i = (y * w + x) * 4;
        const a = bitmap[i + 3] / 255;
        for (let c = 0; c < 3; c++) channels[c].push(bitmap[i + c] * a + 255 * (1 - a));
      }
    }
  }
  const [r, g, b] = channels.map((v) => Math.round(v.sort((p, q) => p - q)[v.length >> 1]));
  return Math.min(r, g, b) >= 235 ? Image.rgbaToColor(255, 255, 255, 255) : Image.rgbaToColor(r, g, b, 255);
}

async function webDerivative(
  bytes: Uint8Array,
  maxDim: number,
  padToSiteAspect = false
): Promise<{ bytes: Uint8Array; padded: boolean } | null> {
  try {
    let img = await Image.decode(bytes);
    const pad = padToSiteAspect && !isSiteAspect(img.width, img.height);
    // Scale so the final (padded) canvas fits maxDim, then pad at that size.
    const [cw, ch] = pad ? siteAspectCanvas(img.width, img.height) : [img.width, img.height];
    const scale = maxDim / Math.max(cw, ch);
    if (scale < 1) {
      img.resize(Math.max(1, Math.round(img.width * scale)), Math.max(1, Math.round(img.height * scale)));
    }
    if (pad) {
      const [w, h] = siteAspectCanvas(img.width, img.height);
      const canvas = new Image(w, h).fill(cornerBackground(img));
      canvas.composite(img, (w - img.width) >> 1, (h - img.height) >> 1);
      img = canvas;
    }
    return { bytes: await img.encodeJPEG(WEB_JPEG_QUALITY), padded: pad };
  } catch {
    return null;
  }
}

async function optimizePhoto(
  bytes: Uint8Array,
  contentType: string
): Promise<{ bytes: Uint8Array; contentType: string; ext: string } | null> {
  try {
    const img = await Image.decode(bytes);
    if (img.width > MAX_PHOTO_DIMENSION || img.height > MAX_PHOTO_DIMENSION) {
      if (img.width >= img.height) {
        img.resize(MAX_PHOTO_DIMENSION, Image.RESIZE_AUTO);
      } else {
        img.resize(Image.RESIZE_AUTO, MAX_PHOTO_DIMENSION);
      }
    }
    const encoded = await img.encodeJPEG(PHOTO_JPEG_QUALITY);
    // Skip the swap if re-encoding didn't actually help (e.g. a source
    // that was already an efficiently-compressed JPEG at a sane size) --
    // only ever replaces the upload when it's a real win.
    if (encoded.length >= bytes.length && contentType === "image/jpeg") {
      return null;
    }
    return { bytes: encoded, contentType: "image/jpeg", ext: "jpg" };
  } catch {
    return null;
  }
}

// Banners get a second, smaller copy of the SAME full frame for phones
// (BannerCarousel picks it via srcset). It's generated in the admin's
// browser (src/lib/r2.ts), not here: imagescript can neither decode WebP
// (what most banners already are) nor encode it, and its JPEG at phone size
// came out ~2x a WebP's weight. The browser posts it back with
// variant=small and it's stored as-is under banner-images/small/ -- the
// prefix the site checks before using a banner's mobile_image_url, so the
// portrait center-crops this function used to generate for that column
// (never shown publicly, since cropping cut people out of the frame) can
// never be mistaken for one.
const SMALL_BANNER_MAX_BYTES = 1024 * 1024;
const SMALL_BANNER_TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg" };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const r2AccessKeyId = Deno.env.get("R2_ACCESS_KEY_ID")!;
    const r2SecretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
    const r2Endpoint = Deno.env.get("R2_ENDPOINT")!;
    const r2Bucket = Deno.env.get("R2_BUCKET_NAME")!;
    const r2PublicUrl = Deno.env.get("R2_PUBLIC_URL")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Missing authorization" }, 401);
    }
    const jwt = authHeader.slice("Bearer ".length);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await adminClient.auth.getUser(jwt);
    if (userError || !userData.user) {
      return json({ error: "Invalid session" }, 401);
    }

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin" || userData.user.app_metadata?.role === "admin";
    if (!isAdmin) {
      return json({ error: "Forbidden" }, 403);
    }

    const r2 = new AwsClient({
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
      service: "s3",
      region: "auto",
    });

    if (req.method === "POST") {
      const form = await req.formData();
      const file = form.get("file");
      const folder = form.get("folder");

      if (!(file instanceof File)) {
        return json({ error: "Missing file" }, 400);
      }
      if (typeof folder !== "string" || !ALLOWED_FOLDERS.has(folder)) {
        return json({ error: "Invalid folder" }, 400);
      }
      if (file.size > MAX_FILE_BYTES) {
        return json({ error: "File exceeds 15MB limit" }, 400);
      }
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        return json({ error: "Unsupported file type" }, 400);
      }

      let bytes = new Uint8Array(await file.arrayBuffer());
      let contentType = file.type || "application/octet-stream";
      let ext = extFromName(file.name);

      if (form.get("variant") === "small") {
        const smallExt = SMALL_BANNER_TYPES[file.type];
        if (folder !== "banner-images" || !smallExt) {
          return json({ error: "Invalid small variant" }, 400);
        }
        if (file.size > SMALL_BANNER_MAX_BYTES) {
          return json({ error: "Small variant exceeds 1MB" }, 400);
        }
        const smallKey = `${folder}/small/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${smallExt}`;
        const smallRes = await r2.fetch(`${r2Endpoint}/${r2Bucket}/${smallKey}`, {
          method: "PUT",
          body: bytes,
          headers: { "Content-Type": file.type, "Cache-Control": "public, max-age=31536000, immutable" },
        });
        if (!smallRes.ok) {
          return json({ error: `R2 upload failed: ${await smallRes.text()}` }, 502);
        }
        return json({ url: `${r2PublicUrl}/${smallKey}` });
      }

      if (folder === "product-images" && file.type.startsWith("image/")) {
        // Original goes up byte-for-byte for print; the site gets the web copy.
        const stamp = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
        const printKey = `${folder}/${stamp}.${ext}`;
        const put = (key: string, body: Uint8Array, type: string) =>
          r2.fetch(`${r2Endpoint}/${r2Bucket}/${key}`, {
            method: "PUT",
            body,
            headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
          });
        const printRes = await put(printKey, bytes, contentType);
        if (!printRes.ok) {
          return json({ error: `R2 upload failed: ${await printRes.text()}` }, 502);
        }
        const printUrl = `${r2PublicUrl}/${printKey}`;
        const web = await webDerivative(bytes, WEB_MAX_DIMENSION[folder], true);
        // A padded copy is needed even when it isn't smaller than the original.
        if (web && (web.padded || web.bytes.length < bytes.length)) {
          const webKey = `${folder}/web/${stamp}.jpg`;
          const webRes = await put(webKey, web.bytes, "image/jpeg");
          if (webRes.ok) {
            return json({ url: `${r2PublicUrl}/${webKey}`, printUrl });
          }
        }
        // Derivative failed or wasn't smaller: the original serves both.
        return json({ url: printUrl });
      }

      if (folder === "category-images" && file.type.startsWith("image/")) {
        const web = await webDerivative(bytes, WEB_MAX_DIMENSION[folder]);
        if (web && web.bytes.length < bytes.length) {
          bytes = web.bytes;
          contentType = "image/jpeg";
          ext = "jpg";
        }
      } else if (PHOTO_FOLDERS.has(folder) && file.type.startsWith("image/")) {
        const optimized = await optimizePhoto(bytes, contentType);
        if (optimized) {
          bytes = optimized.bytes;
          contentType = optimized.contentType;
          ext = optimized.ext;
        }
      }

      const key = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const putRes = await r2.fetch(`${r2Endpoint}/${r2Bucket}/${key}`, {
        method: "PUT",
        body: bytes,
        // Every key is unique (Date.now() + a random suffix) and nothing
        // ever overwrites one in place — a re-uploaded photo just gets a new
        // key and the DB row is repointed at it — so it's always safe for
        // the CDN and browsers to cache a given URL forever. Without this,
        // R2 objects have no Cache-Control at all and Cloudflare served them
        // `cf-cache-status: DYNAMIC` (re-fetched from R2 on every request),
        // which is what PageSpeed's "Use efficient cache lifetimes" finding
        // was flagging. Only covers uploads from this point forward; the
        // ~1,700 objects already in the bucket keep whatever (lack of)
        // caching they have unless separately re-uploaded or fixed via a
        // Cloudflare cache rule on the img.carnivalforyou.com zone.
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });

      if (!putRes.ok) {
        return json({ error: `R2 upload failed: ${await putRes.text()}` }, 502);
      }

      return json({ url: `${r2PublicUrl}/${key}` });
    }

    if (req.method === "DELETE") {
      const body = await req.json().catch(() => null);
      const url = body?.url;
      // Parsed rather than prefix-matched: startsWith() on a base would also
      // accept a host that merely begins with it, e.g.
      // https://img.carnivalforyou.com.example.net/..., and the key derived
      // from such a URL is not this bucket's.
      let parsed: URL | null = null;
      if (typeof url === "string") {
        try {
          parsed = new URL(url);
        } catch {
          parsed = null;
        }
      }
      if (!parsed || !publicHostsFrom(r2PublicUrl).has(parsed.host)) {
        return json({ error: "Invalid url" }, 400);
      }
      const key = decodeURIComponent(parsed.pathname).replace(/^\//, "");
      const folder = key.split("/")[0];
      if (!ALLOWED_FOLDERS.has(folder)) {
        return json({ error: "Invalid key" }, 400);
      }

      const delRes = await r2.fetch(`${r2Endpoint}/${r2Bucket}/${key}`, { method: "DELETE" });
      if (!delRes.ok && delRes.status !== 404) {
        return json({ error: `R2 delete failed: ${await delRes.text()}` }, 502);
      }
      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
