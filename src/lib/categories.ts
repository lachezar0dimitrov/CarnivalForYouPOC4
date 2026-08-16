import { supabase } from '@/lib/supabase';

export type Category = {
  id: number;
  nameBg: string;
  nameEn: string;
  imageUrl: string;
  group: 'main' | 'other';
  sortOrder: number;
  isActive: boolean;
};

type CategoryRow = {
  id: number;
  name_bg: string;
  name_en: string;
  image_url: string;
  group: string;
  sort_order: number;
  is_active: boolean;
};

function mapRow(r: CategoryRow): Category {
  return {
    id: r.id,
    nameBg: r.name_bg ?? '',
    nameEn: r.name_en ?? '',
    imageUrl: r.image_url ?? '',
    group: (r.group as 'main' | 'other') ?? 'other',
    sortOrder: r.sort_order ?? 0,
    isActive: r.is_active ?? true,
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as CategoryRow));
}

export async function fetchAllCategoriesAdmin(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as CategoryRow));
}

export async function saveCategory(
  cat: Partial<Category> & { id?: number }
): Promise<Category | null> {
  const payload = {
    name_bg: cat.nameBg,
    name_en: cat.nameEn,
    image_url: cat.imageUrl,
    group: cat.group,
    sort_order: cat.sortOrder,
    is_active: cat.isActive,
  };

  if (cat.id != null) {
    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', cat.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? mapRow(data as unknown as CategoryRow) : null;
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...payload, id: cat.id })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as unknown as CategoryRow) : null;
}

export async function deleteCategory(id: number): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
