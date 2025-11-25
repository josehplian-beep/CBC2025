-- Create storage bucket for staff profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('staff-profiles', 'staff-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for staff profile images
CREATE POLICY "Anyone can view staff profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'staff-profiles');

CREATE POLICY "Admins and editors can upload staff profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'staff-profiles' AND
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'editor')
    )
  )
);

CREATE POLICY "Admins and editors can update staff profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'staff-profiles' AND
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'editor')
    )
  )
);

CREATE POLICY "Admins and editors can delete staff profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'staff-profiles' AND
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'editor')
    )
  )
);
