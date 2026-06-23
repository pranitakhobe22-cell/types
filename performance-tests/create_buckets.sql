-- ============================================================================
-- STORAGE BUCKETS - Run this in Supabase SQL Editor
-- Creates the 3 required storage buckets for the platform
-- ============================================================================

-- Create buckets (skip if already exists)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('identity-documents', 'identity-documents', true),
  ('proctoring-snapshots', 'proctoring-snapshots', true),
  ('proctoring-clips', 'proctoring-clips', true)
ON CONFLICT (id) DO NOTHING;

-- Permissive storage policy for development (anon + authenticated can upload/read/delete)
DROP POLICY IF EXISTS "Allow all operations for anon and authenticated" ON storage.objects;
CREATE POLICY "Allow all operations for anon and authenticated" 
ON storage.objects FOR ALL 
USING (bucket_id IN ('identity-documents', 'proctoring-snapshots', 'proctoring-clips')) 
WITH CHECK (bucket_id IN ('identity-documents', 'proctoring-snapshots', 'proctoring-clips'));

-- Verify
SELECT id, name, public FROM storage.buckets 
WHERE id IN ('identity-documents', 'proctoring-snapshots', 'proctoring-clips');
