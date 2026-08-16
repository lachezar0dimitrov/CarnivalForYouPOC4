import { supabase } from '@/lib/supabase';

export type SiteSettings = {
  address: string;
  phone: string;
  email: string;
  hoursBg: { day: string; time: string }[];
  hoursEn: { day: string; time: string }[];
  mapsQuery: string;
};

type SettingsRow = {
  id: number;
  address: string;
  phone: string;
  email: string;
  hours_bg: { day: string; time: string }[];
  hours_en: { day: string; time: string }[];
  maps_query: string;
};

function mapRow(r: SettingsRow): SiteSettings {
  return {
    address: r.address ?? '',
    phone: r.phone ?? '',
    email: r.email ?? '',
    hoursBg: r.hours_bg ?? [],
    hoursEn: r.hours_en ?? [],
    mapsQuery: r.maps_query ?? '',
  };
}

export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data as unknown as SettingsRow);
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .update({
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      hours_bg: settings.hoursBg,
      hours_en: settings.hoursEn,
      maps_query: settings.mapsQuery,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) throw error;
}
