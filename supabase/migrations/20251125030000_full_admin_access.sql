-- COMPREHENSIVE ADMIN ACCESS FOR josehplian@gmail.com
-- User ID: 95519015-fb5a-47ab-902e-36af1b275b8a

-- ============================================
-- STEP 1: Fix User Roles
-- ============================================

-- Remove old 'admin' role
DELETE FROM public.user_roles 
WHERE user_id = '95519015-fb5a-47ab-902e-36af1b275b8a';

-- Grant all necessary roles
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('95519015-fb5a-47ab-902e-36af1b275b8a', 'administrator'),
  ('95519015-fb5a-47ab-902e-36af1b275b8a', 'editor'),
  ('95519015-fb5a-47ab-902e-36af1b275b8a', 'staff')
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- STEP 2: Fix ALL Storage Bucket Policies
-- ============================================

-- Drop all existing restrictive policies
DROP POLICY IF EXISTS "Admins can upload member profile images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update member profile images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete member profile images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload department photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update department photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete department photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload album images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update album images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete album images" ON storage.objects;

-- Create unified policies for ALL authenticated users with admin/editor roles

-- MEMBER-PROFILES BUCKET
CREATE POLICY "Admins and editors can upload to member-profiles"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'member-profiles' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'editor', 'staff')
  )
);

CREATE POLICY "Admins and editors can update member-profiles"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'member-profiles' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'editor', 'staff')
  )
);

CREATE POLICY "Admins and editors can delete from member-profiles"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'member-profiles' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'editor', 'staff')
  )
);

-- DEPARTMENT-PHOTOS BUCKET
CREATE POLICY "Admins and editors can upload to department-photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'department-photos' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'editor', 'staff')
  )
);

CREATE POLICY "Admins and editors can update department-photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'department-photos' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'editor', 'staff')
  )
);

CREATE POLICY "Admins and editors can delete from department-photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'department-photos' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'editor', 'staff')
  )
);

-- ALBUMS BUCKET
CREATE POLICY "Admins and editors can upload to albums"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'albums' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'editor', 'staff')
  )
);

CREATE POLICY "Admins and editors can update albums"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'albums' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'editor', 'staff')
  )
);

CREATE POLICY "Admins and editors can delete from albums"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'albums' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'editor', 'staff')
  )
);

-- ============================================
-- STEP 3: Verify User Roles
-- ============================================
-- You can check your roles after running this with:
-- SELECT * FROM user_roles WHERE user_id = '95519015-fb5a-47ab-902e-36af1b275b8a';
