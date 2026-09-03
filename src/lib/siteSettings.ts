import { supabase } from '@/lib/supabase';
import type { ThemeOverride } from '@/lib/season';

export type SiteSettings = {
  address: string;
  phone: string;
  email: string;
  hoursBg: { day: string; time: string }[];
  hoursEn: { day: string; time: string }[];
  mapsQuery: string;
  themeOverride: ThemeOverride;
  splashVideoEnabled: boolean;
  servicesPageEnabled: boolean;
  newsPageEnabled: boolean;
};

type SettingsRow = {
  id: number;
  address: string;
  phone: string;
  email: string;
  hours_bg: { day: string; time: string }[];
  hours_en: { day: string; time: string }[];
  maps_query: string;
  theme_override: ThemeOverride;
  splash_video_enabled: boolean;
  services_page_enabled: boolean;
  news_page_enabled: boolean;
};

function mapRow(r: SettingsRow): SiteSettings {
  return {
    address: r.address ?? '',
    phone: r.phone ?? '',
    email: r.email ?? '',
    hoursBg: r.hours_bg ?? [],
    hoursEn: r.hours_en ?? [],
    mapsQuery: r.maps_query ?? '',
    themeOverride: r.theme_override ?? 'auto',
    splashVideoEnabled: r.splash_video_enabled ?? true,
    servicesPageEnabled: r.services_page_enabled ?? true,
    newsPageEnabled: r.news_page_enabled ?? true,
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
      theme_override: settings.themeOverride,
      splash_video_enabled: settings.splashVideoEnabled,
      services_page_enabled: settings.servicesPageEnabled,
      news_page_enabled: settings.newsPageEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) throw error;
}
