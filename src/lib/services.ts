import { supabase } from '@/lib/supabase';

export type Service = {
  id: number;
  titleBg: string;
  titleEn: string;
  descriptionBg: string;
  descriptionEn: string;
  icon: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
};

type ServiceRow = {
  id: number;
  title_bg: string;
  title_en: string;
  description_bg: string;
  description_en: string;
  icon: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
};

function mapRow(r: ServiceRow): Service {
  return {
    id: r.id,
    titleBg: r.title_bg ?? '',
    titleEn: r.title_en ?? '',
    descriptionBg: r.description_bg ?? '',
    descriptionEn: r.description_en ?? '',
    icon: r.icon ?? 'Sparkles',
    imageUrl: r.image_url ?? '',
    isActive: r.is_active,
    sortOrder: r.sort_order,
  };
}

// Fetch active services for the public Services page (sorted by sort_order)
export async function fetchActiveServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as ServiceRow));
}

// Fetch all services for the admin panel
export async function fetchAllServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as ServiceRow));
}

export async function saveService(service: Partial<Service> & { id?: number }): Promise<Service | null> {
  const payload = {
    title_bg: service.titleBg,
    title_en: service.titleEn,
    description_bg: service.descriptionBg,
    description_en: service.descriptionEn,
    icon: service.icon,
    image_url: service.imageUrl,
    is_active: service.isActive,
    sort_order: service.sortOrder,
    updated_at: new Date().toISOString(),
  };

  if (service.id != null) {
    const { data, error } = await supabase
      .from('services')
      .update(payload)
      .eq('id', service.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? mapRow(data as unknown as ServiceRow) : null;
  }

  const { data, error } = await supabase
    .from('services')
    .insert(payload)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as unknown as ServiceRow) : null;
}

export async function deleteService(id: number): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
}
