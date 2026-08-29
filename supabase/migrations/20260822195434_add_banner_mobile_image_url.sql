-- Auto-generated portrait crop of the main banner image, produced by the
-- r2-media upload function so admins never have to prepare a second file.
-- Nullable: falls back to the main image_url when absent (older banners,
-- or if generation failed for some reason).
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_image_url text;
