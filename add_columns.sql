-- Run this in your Supabase SQL Editor once to add support for custom questions and role settings
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS company TEXT DEFAULT 'General';
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS access_key TEXT;
