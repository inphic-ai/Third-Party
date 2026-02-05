-- Migration: Add imageUrl field to announcements table
-- Created: 2026-02-05
-- Description: Add optional imageUrl field to support image uploads in announcements

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN announcements.image_url IS 'URL of the uploaded image for the announcement';
