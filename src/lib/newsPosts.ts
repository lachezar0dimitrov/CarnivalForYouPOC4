import { supabase } from '@/lib/supabase';

export type NewsPostRecord = {
  id: number;
  titleBg: string;
  titleEn: string;
  excerptBg: string;
  excerptEn: string;
  categoryBg: string;
  categoryEn: string;
  postDate: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
};

type NewsPostRow = {
  id: number;
  title_bg: string;
  title_en: string;
  excerpt_bg: string;
  excerpt_en: string;
  category_bg: string;
  category_en: string;
  post_date: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
};

function mapRow(r: NewsPostRow): NewsPostRecord {
  return {
    id: r.id,
    titleBg: r.title_bg ?? '',
    titleEn: r.title_en ?? '',
    excerptBg: r.excerpt_bg ?? '',
    excerptEn: r.excerpt_en ?? '',
    categoryBg: r.category_bg ?? '',
    categoryEn: r.category_en ?? '',
    postDate: r.post_date,
    imageUrl: r.image_url ?? '',
    isActive: r.is_active,
    sortOrder: r.sort_order,
  };
}

// Fetch active posts for the public News page (sorted by sort_order)
export async function fetchActiveNewsPosts(): Promise<NewsPostRecord[]> {
  const { data, error } = await supabase
    .from('news_posts')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as NewsPostRow));
}

// Fetch all posts for the admin panel
export async function fetchAllNewsPosts(): Promise<NewsPostRecord[]> {
  const { data, error } = await supabase
    .from('news_posts')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as NewsPostRow));
}

export async function saveNewsPost(post: Partial<NewsPostRecord> & { id?: number }): Promise<NewsPostRecord | null> {
  const payload = {
    title_bg: post.titleBg,
    title_en: post.titleEn,
    excerpt_bg: post.excerptBg,
    excerpt_en: post.excerptEn,
    category_bg: post.categoryBg,
    category_en: post.categoryEn,
    post_date: post.postDate,
    image_url: post.imageUrl,
    is_active: post.isActive,
    sort_order: post.sortOrder,
    updated_at: new Date().toISOString(),
  };

  if (post.id != null) {
    const { data, error } = await supabase
      .from('news_posts')
      .update(payload)
      .eq('id', post.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? mapRow(data as unknown as NewsPostRow) : null;
  }

  const { data, error } = await supabase
    .from('news_posts')
    .insert(payload)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as unknown as NewsPostRow) : null;
}

export async function deleteNewsPost(id: number): Promise<void> {
  const { error } = await supabase.from('news_posts').delete().eq('id', id);
  if (error) throw error;
}
