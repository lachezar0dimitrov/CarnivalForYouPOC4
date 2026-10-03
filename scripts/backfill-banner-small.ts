// One-off backfill: gives every existing banner the phone-sized copy that
// new admin uploads now get automatically (src/lib/r2.ts makeSmallBanner):
// the same full frame downscaled to 828px wide, WebP, stored under
// banner-images/small/ and saved to banners.mobile_image_url (which used
// to hold portrait center-crops the site never showed).
//
//   npx deno run -A --node-modules-dir=none scripts/backfill-banner-small.ts --dry-run
//   npx deno run -A --node-modules-dir=none scripts/backfill-banner-small.ts
//
// Safe to re-run: banners that already have a banner-images/small/ copy are
// skipped. Writes only NEW R2 keys (img.carnivalforyou.com is cached for a
// year, nothing is ever overwritten in place) and backs up every row's
// previous mobile_image_url to imports/ first; rollback = restore those
// values. A row is only updated if its image_url is still the one the copy
// was made from.
import { AwsClient } from "npm:aws4fetch@1.0.20";
import sharp from "npm:sharp@0.33.5";

const SMALL_WIDTH = 828;
// The bucket's custom (cached) domain every banner URL uses -- not .env's
// R2_PUBLIC_URL, which still holds the old r2.dev development URL.
const PUBLIC_BASE = "https://img.carnivalforyou.com";
const dryRun = Deno.args.includes("--dry-run");

const env: Record<string, string> = {};
for (const line of (await Deno.readTextFile(new URL("../.env", import.meta.url))).split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const db = (path: string, init: RequestInit = {}) =>
  fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

type Row = { id: number; is_active: boolean; image_url: string; mobile_image_url: string | null };
const res = await db("banners?select=id,is_active,image_url,mobile_image_url&order=id");
if (!res.ok) throw new Error(`banners read failed: ${res.status} ${await res.text()}`);
const rows: Row[] = await res.json();

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = new URL(`../imports/banner-mobile-backup-${stamp}.json`, import.meta.url);
await Deno.writeTextFile(backupPath, JSON.stringify(rows, null, 2));
console.log(`backup: ${decodeURIComponent(backupPath.pathname)} (${rows.length} rows)`);

const r2 = new AwsClient({
  accessKeyId: env.R2_ACCESS_KEY_ID,
  secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
});

for (const row of rows) {
  const label = `#${row.id}${row.is_active ? "" : " (inactive)"}`;
  if (row.mobile_image_url?.includes("/banner-images/small/")) {
    console.log(`${label} skip: already has ${row.mobile_image_url}`);
    continue;
  }
  const src = await fetch(row.image_url);
  if (!src.ok) {
    console.log(`${label} SKIP: source ${src.status} ${row.image_url}`);
    continue;
  }
  const input = new Uint8Array(await src.arrayBuffer());
  const meta = await sharp(input).metadata();
  if (!meta.width || meta.width <= SMALL_WIDTH * 1.15) {
    console.log(`${label} skip: source only ${meta.width}px wide`);
    continue;
  }
  const small = await sharp(input).resize({ width: SMALL_WIDTH }).webp({ quality: 80 }).toBuffer();
  const smallMeta = await sharp(small).metadata();
  console.log(
    `${label} ${meta.width}x${meta.height} ${Math.round(input.length / 1024)}KB -> ` +
      `${smallMeta.width}x${smallMeta.height} ${Math.round(small.length / 1024)}KB`
  );
  if (dryRun) {
    await Deno.writeFile(new URL(`../imports/banner-small-preview-${row.id}.webp`, import.meta.url), small);
    continue;
  }

  const key = `banner-images/small/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`;
  const put = await r2.fetch(`${env.R2_ENDPOINT}/${env.R2_BUCKET_NAME}/${key}`, {
    method: "PUT",
    body: small,
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
  });
  if (!put.ok) throw new Error(`${label} R2 upload failed: ${put.status} ${await put.text()}`);
  const publicUrl = `${PUBLIC_BASE}/${key}`;

  // GET, not HEAD -- verifies what the CDN actually serves.
  const check = await fetch(publicUrl);
  const served = new Uint8Array(await check.arrayBuffer());
  if (!check.ok || served.length !== small.length) {
    throw new Error(`${label} verify failed: ${check.status}, ${served.length} vs ${small.length} bytes`);
  }

  const upd = await db(`banners?id=eq.${row.id}&image_url=eq.${encodeURIComponent(row.image_url)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ mobile_image_url: publicUrl }),
  });
  const updated = upd.ok ? await upd.json() : [];
  if (!upd.ok || updated.length !== 1) {
    throw new Error(`${label} DB update failed or row changed meanwhile: ${upd.status}`);
  }
  console.log(`${label} done: ${publicUrl}`);
}
