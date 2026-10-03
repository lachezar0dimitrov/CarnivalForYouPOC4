import { supabase } from '@/lib/supabase';

export type Banner = {
  id: number;
  imageUrl: string;
  mobileImageUrl: string | null;
  titleBg: string;
  titleEn: string;
  subtitleBg: string;
  subtitleEn: string;
  linkUrl: string;
  isActive: boolean;
  sortOrder: number;
};

type BannerRow = {
  id: number;
  image_url: string;
  mobile_image_url: string | null;
  title_bg: string;
  title_en: string;
  subtitle_bg: string;
  subtitle_en: string;
  link_url: string;
  is_active: boolean;
  sort_order: number;
};

function mapRow(r: BannerRow): Banner {
  return {
    id: r.id,
    imageUrl: r.image_url,
    mobileImageUrl: r.mobile_image_url ?? null,
    titleBg: r.title_bg ?? '',
    titleEn: r.title_en ?? '',
    subtitleBg: r.subtitle_bg ?? '',
    subtitleEn: r.subtitle_en ?? '',
    linkUrl: r.link_url ?? '',
    isActive: r.is_active,
    sortOrder: r.sort_order,
  };
}

// Active banner rows the homepage HTML already carries, injected at the edge
// by functions/_middleware.js (same query as fetchActiveBanners below) so
// the first slide can render on React's very first pass instead of after a
// Supabase round trip. null when absent or unreadable -- callers then just
// wait for the live query as before.
export function readInlineBanners(): Banner[] | null {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById('cfy-banners');
  if (!el?.textContent) return null;
  try {
    const rows = JSON.parse(el.textContent) as unknown;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return rows.map((r) => mapRow(r as BannerRow));
  } catch {
    return null;
  }
}

// Fetch active banners for the public homepage (sorted by sort_order)
export async function fetchActiveBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as BannerRow));
}

// Fetch all banners for the admin panel
export async function fetchAllBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as BannerRow));
}

export async function saveBanner(banner: Partial<Banner> & { id?: number }): Promise<Banner | null> {
  const payload = {
    image_url: banner.imageUrl,
    mobile_image_url: banner.mobileImageUrl || null,
    title_bg: banner.titleBg,
    title_en: banner.titleEn,
    subtitle_bg: banner.subtitleBg,
    subtitle_en: banner.subtitleEn,
    link_url: banner.linkUrl,
    is_active: banner.isActive,
    sort_order: banner.sortOrder,
  };

  if (banner.id != null) {
    const { data, error } = await supabase
      .from('banners')
      .update(payload)
      .eq('id', banner.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? mapRow(data as unknown as BannerRow) : null;
  }

  const { data, error } = await supabase
    .from('banners')
    .insert(payload)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as unknown as BannerRow) : null;
}

export async function deleteBanner(id: number): Promise<void> {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) throw error;
}
