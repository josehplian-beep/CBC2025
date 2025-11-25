-- FINAL FIX: Grant Full Access to josehplian@gmail.com
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/auztoefiuddwerfbpcpm/sql/new

-- Step 1: Clear old roles and add new ones
DELETE FROM public.user_roles WHERE user_id = '95519015-fb5a-47ab-902e-36af1b275b8a';

INSERT INTO public.user_roles (user_id, role) VALUES 
  ('95519015-fb5a-47ab-902e-36af1b275b8a', 'administrator'),
  ('95519015-fb5a-47ab-902e-36af1b275b8a', 'editor'),
  ('95519015-fb5a-47ab-902e-36af1b275b8a', 'staff');

-- Step 2: Fix storage policies (drop old ones)
DROP POLICY IF EXISTS "Admins can upload member profile images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update member profile images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete member profile images" ON storage.objects;

-- Step 3: Create new policies that work with your roles
CREATE POLICY "Upload to member-profiles" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'member-profiles' AND auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role IN ('administrator', 'editor', 'staff')
));

CREATE POLICY "Update member-profiles" ON storage.objects FOR UPDATE
USING (bucket_id = 'member-profiles' AND auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role IN ('administrator', 'editor', 'staff')
));

CREATE POLICY "Delete from member-profiles" ON storage.objects FOR DELETE
USING (bucket_id = 'member-profiles' AND auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role IN ('administrator', 'editor', 'staff')
));
