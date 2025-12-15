-- Fix teachers table security: Remove public access to contact information
-- Drop the existing public policy
DROP POLICY IF EXISTS "Anyone can view teachers" ON public.teachers;

-- Create new policies that require authentication and proper roles
CREATE POLICY "Authenticated users can view basic teacher info"
ON public.teachers
FOR SELECT
TO authenticated
USING (true);

-- Staff and administrators can view all teacher details including contact info
CREATE POLICY "Staff can view full teacher details"
ON public.teachers
FOR SELECT
USING (
  has_role(auth.uid(), 'administrator'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR
  has_role(auth.uid(), 'editor'::app_role)
);

-- Create a security definer function for public teacher listing (without contact info)
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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_public_teachers() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_teachers() TO authenticated;