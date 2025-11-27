-- Enable storage policies for the albums bucket
-- This allows administrators and editors to upload message images

-- Policy to allow administrators to insert files into albums bucket
CREATE POLICY "Administrators can upload to albums bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'albums' 
  AND has_role(auth.uid(), 'administrator'::app_role)
);

-- Policy to allow editors to insert files into albums bucket
CREATE POLICY "Editors can upload to albums bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'albums' 
  AND has_role(auth.uid(), 'editor'::app_role)
);

-- Policy to allow anyone to read from albums bucket (for public message images)
CREATE POLICY "Anyone can view albums bucket files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'albums');

-- Policy to allow administrators to update files in albums bucket
CREATE POLICY "Administrators can update albums bucket files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'albums' 
  AND has_role(auth.uid(), 'administrator'::app_role)
);

-- Policy to allow editors to update files in albums bucket
CREATE POLICY "Editors can update albums bucket files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'albums' 
  AND has_role(auth.uid(), 'editor'::app_role)
);

-- Policy to allow administrators to delete files from albums bucket
CREATE POLICY "Administrators can delete from albums bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'albums' 
  AND has_role(auth.uid(), 'administrator'::app_role)
);

-- Policy to allow editors to delete files from albums bucket
CREATE POLICY "Editors can delete from albums bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'albums' 
  AND has_role(auth.uid(), 'editor'::app_role)
);