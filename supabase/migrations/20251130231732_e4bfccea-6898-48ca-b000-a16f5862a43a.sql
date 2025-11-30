-- Create storage buckets for teacher and student photos
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('teacher-photos', 'teacher-photos', true),
  ('student-photos', 'student-photos', true);

-- RLS policies for teacher-photos bucket
CREATE POLICY "Anyone can view teacher photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'teacher-photos');

CREATE POLICY "Administrators can upload teacher photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'teacher-photos' 
  AND has_role(auth.uid(), 'administrator'::app_role)
);

CREATE POLICY "Administrators can update teacher photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'teacher-photos' 
  AND has_role(auth.uid(), 'administrator'::app_role)
);

CREATE POLICY "Administrators can delete teacher photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'teacher-photos' 
  AND has_role(auth.uid(), 'administrator'::app_role)
);

-- RLS policies for student-photos bucket
CREATE POLICY "Staff can view student photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-photos' 
  AND (
    has_role(auth.uid(), 'administrator'::app_role) 
    OR has_role(auth.uid(), 'staff'::app_role)
  )
);

CREATE POLICY "Administrators can upload student photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-photos' 
  AND has_role(auth.uid(), 'administrator'::app_role)
);

CREATE POLICY "Administrators can update student photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'student-photos' 
  AND has_role(auth.uid(), 'administrator'::app_role)
);

CREATE POLICY "Administrators can delete student photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-photos' 
  AND has_role(auth.uid(), 'administrator'::app_role)
);