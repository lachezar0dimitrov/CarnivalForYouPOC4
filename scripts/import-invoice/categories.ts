import { createClient } from '@supabase/supabase-js';

export type CategoryOption = {
  id: number;
  nameBg: string;
  nameEn: string;
  group: string;
};

// Live category list from the real DB (not hardcoded IDs) — so the import
// tool stays correct as categories are added/renamed/removed (e.g. the
// "Големи размери"/"Двойки" categories added 2026-09-13), and both the
// Excel dropdown and the admin loader's validation always match reality.
export async function fetchCategories(): Promise<CategoryOption[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY липсват в .env');
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('categories')
    .select('id, name_bg, name_en, "group", is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    nameBg: r.name_bg ?? '',
    nameEn: r.name_en ?? '',
    group: r.group ?? 'other',
  }));
}
