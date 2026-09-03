ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS services_page_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS news_page_enabled boolean NOT NULL DEFAULT true;
