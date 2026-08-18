import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { AwsClient } from "npm:aws4fetch@1.0.20";

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

      const key = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extFromName(file.name)}`;
      const putRes = await r2.fetch(`${r2Endpoint}/${r2Bucket}/${key}`, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      if (!putRes.ok) {
        return json({ error: `R2 upload failed: ${await putRes.text()}` }, 502);
      }

      return json({ url: `${r2PublicUrl}/${key}` });
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
