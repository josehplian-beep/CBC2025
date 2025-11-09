-- Create storage bucket for member profile images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-profiles', 'member-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for member profile images
CREATE POLICY "Anyone can view member profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'member-profiles');

CREATE POLICY "Admins can upload member profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'member-profiles' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can update member profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'member-profiles' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can delete member profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'member-profiles' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

-- Rename ministry column to department
ALTER TABLE public.members 
RENAME COLUMN ministry TO department;