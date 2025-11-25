-- Drop old policies for member-profiles bucket
DROP POLICY IF EXISTS "Admins can upload member profile images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update member profile images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete member profile images" ON storage.objects;

-- Create new policies that work with user_roles table
CREATE POLICY "Admins and editors can upload to member-profiles"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'member-profiles' AND
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'editor')
    )
  )
);

CREATE POLICY "Admins and editors can update member-profiles"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'member-profiles' AND
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'editor')
    )
  )
);

CREATE POLICY "Admins and editors can delete from member-profiles"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'member-profiles' AND
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'editor')
    )
  )
);
