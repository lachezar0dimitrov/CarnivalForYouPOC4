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

// Center-crops a wide banner photo down to a near-square portrait frame
// (banners here are always a centered focal subject with symmetric
// flanking elements, so a horizontal center crop keeps the subject in
// frame without needing real subject detection) and re-encodes as JPEG
// for a much smaller mobile payload than the source PNG. Returns null on
// any failure so a bad/unsupported source image never blocks the main
// upload. Ratio is 0.9 (not a tighter 4:5) to match the ~0.9–1.1 aspect
// of a real phone's `min-h-50vh` hero box across common devices — the
// closer this is to the container's own shape, the less object-fit:cover
// has to crop again on top of this crop to fill it.
async function generateMobileCrop(bytes: Uint8Array): Promise<Uint8Array | null> {
  try {
    const img = await Image.decode(bytes);
    const targetRatio = 0.9;
    const cropWidth = Math.min(img.width, Math.round(img.height * targetRatio));
    const cropX = Math.round((img.width - cropWidth) / 2);
    const cropped = img.crop(cropX, 0, cropWidth, img.height);
    return await cropped.encodeJPEG(85);
  } catch {
    return null;
  }
}

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

      if (PHOTO_FOLDERS.has(folder) && file.type.startsWith("image/")) {
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

      // Banners additionally get an auto-generated portrait crop for mobile
      // — best-effort: a failed/slow crop never blocks the main upload.
      let mobileUrl: string | undefined;
      if (folder === "banner-images" && file.type.startsWith("image/")) {
        const mobileBytes = await generateMobileCrop(bytes);
        if (mobileBytes) {
          const mobileKey = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-mobile.jpg`;
          const mobilePutRes = await r2.fetch(`${r2Endpoint}/${r2Bucket}/${mobileKey}`, {
            method: "PUT",
            body: mobileBytes,
            headers: {
              "Content-Type": "image/jpeg",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
          if (mobilePutRes.ok) {
            mobileUrl = `${r2PublicUrl}/${mobileKey}`;
          }
        }
      }

      return json({ url: `${r2PublicUrl}/${key}`, mobileUrl });
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
