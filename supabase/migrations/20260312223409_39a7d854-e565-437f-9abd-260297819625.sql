
-- Make department-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'department-photos';

-- Create a read policy so anyone can view department photos via signed URLs
CREATE POLICY "Anyone can read department photos" ON storage.objects
FOR SELECT USING (bucket_id = 'department-photos');
