ALTER TABLE public.site_settings
  ADD COLUMN theme_override text NOT NULL DEFAULT 'auto'
  CHECK (theme_override IN ('auto', 'main', 'christmas'));
