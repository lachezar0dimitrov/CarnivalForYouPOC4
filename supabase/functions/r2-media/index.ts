import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { AwsClient } from "npm:aws4fetch@1.0.20";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ALLOWED_FOLDERS = new Set(["product-images", "banner-images", "category-images"]);
const MAX_FILE_BYTES = 15 * 1024 * 1024;

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

      const bytes = new Uint8Array(await file.arrayBuffer());
      const key = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extFromName(file.name)}`;
      const putRes = await r2.fetch(`${r2Endpoint}/${r2Bucket}/${key}`, {
        method: "PUT",
        body: bytes,
        headers: { "Content-Type": file.type || "application/octet-stream" },
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
            headers: { "Content-Type": "image/jpeg" },
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
      if (typeof url !== "string" || !url.startsWith(r2PublicUrl)) {
        return json({ error: "Invalid url" }, 400);
      }
      const key = url.slice(r2PublicUrl.length).replace(/^\//, "");
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
