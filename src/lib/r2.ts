import { supabase } from '@/lib/supabase';

export type ImageBucket = 'product-images' | 'banner-images' | 'category-images' | 'content-images';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-media`;

async function authHeader(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Not authenticated');
  return `Bearer ${data.session.access_token}`;
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.error || res.statusText;
}

export type UploadResult = { url: string; mobileUrl?: string };

// mobileUrl is only ever populated for the 'banner-images' bucket — the
// r2-media function auto-generates a portrait crop for banners specifically
// (see supabase/functions/r2-media/index.ts), so callers uploading products
// or categories just get url and can ignore the second field.
export async function uploadImage(bucket: ImageBucket, file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', bucket);

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { Authorization: await authHeader() },
    body: form,
  });

  if (!res.ok) throw new Error(await readError(res));

  return res.json();
}

export async function deleteImage(url: string): Promise<void> {
  const res = await fetch(FUNCTION_URL, {
    method: 'DELETE',
    headers: {
      Authorization: await authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) throw new Error(await readError(res));
}
