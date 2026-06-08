-- Run this in your Supabase SQL Editor to create the missing buckets

-- 1. Create the buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('identity-documents', 'identity-documents', true),
  ('proctoring-snapshots', 'proctoring-snapshots', true),
  ('proctoring-clips', 'proctoring-clips', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create permissive policies for development (WARNING: Open to public)
-- Allows any user (even anonymous) to upload, read, and delete files in these buckets.
CREATE POLICY "Allow all operations for anon and authenticated" 
ON storage.objects FOR ALL 
USING (bucket_id IN ('identity-documents', 'proctoring-snapshots', 'proctoring-clips')) 
WITH CHECK (bucket_id IN ('identity-documents', 'proctoring-snapshots', 'proctoring-clips'));
