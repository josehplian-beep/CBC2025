-- Fix 1: Remove the public policy that exposes staff email/phone
DROP POLICY IF EXISTS "Anyone can view published staff bio public fields" ON public.staff_biographies;

-- Create a new policy that allows public access ONLY through the secure view
-- The view already exists (staff_biographies_public) but let's make sure it doesn't include sensitive fields

-- Drop and recreate the view to exclude email and phone
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
FROM public.staff_biographies
WHERE is_published = true;

-- Grant SELECT on the view to anon and authenticated users
GRANT SELECT ON public.staff_biographies_public TO anon, authenticated;

-- Fix 2: Ensure students table has proper RLS - it already has policies but let's verify they're restrictive
-- The existing policies look correct (only administrators and staff can access)
-- But let's add an explicit deny for anonymous users

-- Create a policy to explicitly deny anonymous access to students
CREATE POLICY "Anonymous users cannot access students"
ON public.students
FOR ALL
TO anon
USING (false)
WITH CHECK (false);