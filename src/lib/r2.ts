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

export type UploadResult = { url: string; mobileUrl?: string; printUrl?: string };

async function postFile(form: FormData): Promise<UploadResult> {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { Authorization: await authHeader() },
    body: form,
  });

  if (!res.ok) throw new Error(await readError(res));

  return res.json();
}

// Width of the phone copy of a banner. The banner box is full-width, so a
// typical phone (~400 CSS px at 2x) needs ~800 device pixels; anything
// wider than that (high-DPR phones, tablets, desktop) still gets the full
// photo via srcset in BannerCarousel.
const SMALL_BANNER_WIDTH = 828;

// Downscales the banner to SMALL_BANNER_WIDTH, keeping the whole frame (no
// crop), as WebP -- or JPEG on a browser that can't encode WebP. Halving
// steps first keep a large source from aliasing in one big drawImage jump.
// null when the source is already about that small or anything fails: the
// banner then just has no phone copy and the site uses the full photo.
async function makeSmallBanner(file: File): Promise<File | null> {
  try {
    const bitmap = await createImageBitmap(file);
    if (bitmap.width <= SMALL_BANNER_WIDTH * 1.15) return null;

    let source: CanvasImageSource = bitmap;
    let w = bitmap.width;
    let h = bitmap.height;
    const targetH = Math.round((bitmap.height * SMALL_BANNER_WIDTH) / bitmap.width);
    while (w / 2 >= SMALL_BANNER_WIDTH) {
      const step = document.createElement('canvas');
      step.width = Math.round(w / 2);
      step.height = Math.round(h / 2);
      const sctx = step.getContext('2d');
      if (!sctx) return null;
      sctx.imageSmoothingQuality = 'high';
      sctx.drawImage(source, 0, 0, step.width, step.height);
      source = step;
      w = step.width;
      h = step.height;
    }
    const canvas = document.createElement('canvas');
    canvas.width = SMALL_BANNER_WIDTH;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, SMALL_BANNER_WIDTH, targetH);
    bitmap.close();

    const toBlob = (type: string, quality: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    let blob = await toBlob('image/webp', 0.8);
    // Browsers without a WebP encoder silently hand back a PNG instead.
    if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg', 0.82);
    if (!blob || (blob.type !== 'image/jpeg' && blob.type !== 'image/webp')) return null;
    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    return new File([blob], `banner-small.${ext}`, { type: blob.type });
  } catch {
    return null;
  }
}

// mobileUrl is only ever populated for the 'banner-images' bucket: a
// smaller copy of the same full frame for phones, made right here in the
// browser and stored by r2-media under banner-images/small/ (see the note
// there on why it isn't generated server-side). Best-effort -- a failure
// leaves mobileUrl unset and never fails the main upload. Callers uploading
// products or categories just get url and can ignore the field.
// printUrl is only populated for 'product-images': url is then a small web
// derivative for the site and printUrl the untouched original, which must be
// saved to products.print_image_url (the print catalog reads that column).
export async function uploadImage(bucket: ImageBucket, file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', bucket);
  const result = await postFile(form);

  if (bucket === 'banner-images' && file.type.startsWith('image/')) {
    const small = await makeSmallBanner(file);
    if (small) {
      const smallForm = new FormData();
      smallForm.append('file', small);
      smallForm.append('folder', bucket);
      smallForm.append('variant', 'small');
      try {
        const { url } = await postFile(smallForm);
        return { ...result, mobileUrl: url };
      } catch {
        // phone copy is optional -- fall through with the main upload only
      }
    }
    return { url: result.url, printUrl: result.printUrl };
  }

  return result;
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
