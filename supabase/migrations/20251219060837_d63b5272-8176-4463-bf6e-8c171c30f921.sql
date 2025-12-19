-- Fix 1: staff_biographies - Remove public access to contact info, create a public view without sensitive fields
DROP POLICY IF EXISTS "Anyone can view published staff biographies" ON public.staff_biographies;

-- Create or replace the public view to exclude sensitive contact information
DROP VIEW IF EXISTS public.staff_biographies_public;
CREATE VIEW public.staff_biographies_public AS
SELECT 
  id,
  name,
  role,
  biography_content,
  image_url,
  slug,
  display_order,
  is_published,
  ministry_focus,
  spouse_name,
  children_count,
  hobbies,
  created_at,
  updated_at
  -- Intentionally excluding: email, phone
FROM public.staff_biographies
WHERE is_published = true;

-- Grant public access to the view (not the table)
GRANT SELECT ON public.staff_biographies_public TO anon, authenticated;

-- Fix 2: teachers - Remove overly permissive "true" policy, restrict contact info to staff/admin only
DROP POLICY IF EXISTS "Authenticated users can view basic teacher info" ON public.teachers;

-- Create a public function to get teachers without sensitive info
CREATE OR REPLACE FUNCTION public.get_public_teachers()
RETURNS TABLE (
  id uuid,
  full_name text,
  bio text,
  photo_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    full_name,
    bio,
    photo_url,
    created_at,
    updated_at
  FROM public.teachers
  ORDER BY full_name ASC;
$$;

-- Fix 3: members - Restrict member access to only view their own data, not all members' PII
DROP POLICY IF EXISTS "Members can view all members" ON public.members;

-- Members can only view their own linked member record
CREATE POLICY "Members can view their own linked member record"
ON public.members
FOR SELECT
USING (
  has_role(auth.uid(), 'member'::app_role) AND user_id = auth.uid()
);

-- Fix 4: families - Restrict to administrators only (remove staff/viewer access to addresses)
DROP POLICY IF EXISTS "Staff and viewer can view families" ON public.families;

-- Only administrators can view family address data
CREATE POLICY "Only administrators can view families"
ON public.families
FOR SELECT
USING (has_role(auth.uid(), 'administrator'::app_role));

-- Fix 5: child_info - Add class-based restriction (teachers can only see children in their classes)
DROP POLICY IF EXISTS "Staff can view and manage child info" ON public.child_info;

-- Staff can only view child info for students in classes they teach
CREATE POLICY "Staff can view child info for their students"
ON public.child_info
FOR SELECT
USING (
  has_role(auth.uid(), 'administrator'::app_role) OR
  (has_role(auth.uid(), 'staff'::app_role) AND EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.student_classes sc ON s.id = sc.student_id
    JOIN public.class_teachers ct ON sc.class_id = ct.class_id
    JOIN public.teachers t ON ct.teacher_id = t.id
    JOIN public.members m ON t.member_id = m.id
    WHERE s.id = child_info.student_id
    AND m.user_id = auth.uid()
  ))
);

-- Staff can only manage child info for students in their classes
CREATE POLICY "Staff can manage child info for their students"
ON public.child_info
FOR ALL
USING (
  has_role(auth.uid(), 'administrator'::app_role) OR
  (has_role(auth.uid(), 'staff'::app_role) AND EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.student_classes sc ON s.id = sc.student_id
    JOIN public.class_teachers ct ON sc.class_id = ct.class_id
    JOIN public.teachers t ON ct.teacher_id = t.id
    JOIN public.members m ON t.member_id = m.id
    WHERE s.id = child_info.student_id
    AND m.user_id = auth.uid()
  ))
)
WITH CHECK (
  has_role(auth.uid(), 'administrator'::app_role) OR
  (has_role(auth.uid(), 'staff'::app_role) AND EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.student_classes sc ON s.id = sc.student_id
    JOIN public.class_teachers ct ON sc.class_id = ct.class_id
    JOIN public.teachers t ON ct.teacher_id = t.id
    JOIN public.members m ON t.member_id = m.id
    WHERE s.id = child_info.student_id
    AND m.user_id = auth.uid()
  ))
);

-- Fix 6: profiles - Restrict to administrators only (staff don't need all user contact info)
DROP POLICY IF EXISTS "Staff and administrators can view all profiles" ON public.profiles;

-- Only administrators can view all profiles
CREATE POLICY "Only administrators can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'administrator'::app_role));

-- Fix 7: teachers - Ensure teachers table policies don't expose contact info to non-admin users
-- The existing "Staff can view full teacher details" policy is appropriate
-- But we need to ensure anonymous users can't see contact info

-- Create a policy that allows authenticated users to see basic teacher info via the function only
-- No direct table access for contact fields