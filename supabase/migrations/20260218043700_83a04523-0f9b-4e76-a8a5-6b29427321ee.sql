
-- Drop old policies that use 'admin' role (wrong role)
DROP POLICY IF EXISTS "Admins can delete department photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update department photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload department photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete department profile images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update department profile images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload department profile images" ON storage.objects;

-- Recreate with correct 'administrator' role
CREATE POLICY "Admins can upload department photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'department-photos' AND has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Admins can update department photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'department-photos' AND has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Admins can delete department photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'department-photos' AND has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Admins can upload department profile images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'department-profiles' AND has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Admins can update department profile images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'department-profiles' AND has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Admins can delete department profile images"
ON storage.objects FOR DELETE
USING (bucket_id = 'department-profiles' AND has_role(auth.uid(), 'administrator'::app_role));

-- Also allow editors to manage department photos
CREATE POLICY "Editors can upload department photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'department-photos' AND has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can update department photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'department-photos' AND has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can delete department photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'department-photos' AND has_role(auth.uid(), 'editor'::app_role));
