-- Make the student-photos bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'student-photos';

-- Create RLS policies for student-photos bucket if not exists
-- Allow staff/admin to view student photos
DO $$
BEGIN
  -- Drop existing policies to recreate them
  DROP POLICY IF EXISTS "Staff can view student photos" ON storage.objects;
  DROP POLICY IF EXISTS "Staff can upload student photos" ON storage.objects;
  DROP POLICY IF EXISTS "Staff can update student photos" ON storage.objects;
  DROP POLICY IF EXISTS "Staff can delete student photos" ON storage.objects;
END $$;

-- Staff and administrators can view student photos
CREATE POLICY "Staff can view student photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-photos' 
  AND (
    public.has_role(auth.uid(), 'administrator'::public.app_role) 
    OR public.has_role(auth.uid(), 'staff'::public.app_role)
  )
);

-- Staff and administrators can upload student photos
CREATE POLICY "Staff can upload student photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-photos' 
  AND (
    public.has_role(auth.uid(), 'administrator'::public.app_role) 
    OR public.has_role(auth.uid(), 'staff'::public.app_role)
  )
);

-- Staff and administrators can update student photos
CREATE POLICY "Staff can update student photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'student-photos' 
  AND (
    public.has_role(auth.uid(), 'administrator'::public.app_role) 
    OR public.has_role(auth.uid(), 'staff'::public.app_role)
  )
);

-- Staff and administrators can delete student photos
CREATE POLICY "Staff can delete student photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-photos' 
  AND (
    public.has_role(auth.uid(), 'administrator'::public.app_role) 
    OR public.has_role(auth.uid(), 'staff'::public.app_role)
  )
);