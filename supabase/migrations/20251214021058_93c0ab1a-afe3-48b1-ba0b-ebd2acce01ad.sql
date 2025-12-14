-- Fix security issues for staff_biographies and profiles tables

-- 1. Drop existing public policies on staff_biographies that might expose contact info
DROP POLICY IF EXISTS "Anyone can view published staff biographies" ON public.staff_biographies;
DROP POLICY IF EXISTS "Public can view published staff biographies" ON public.staff_biographies;

-- 2. Drop the existing function first (return type is changing)
DROP FUNCTION IF EXISTS public.get_public_staff_biographies();

-- 3. Recreate the function WITHOUT email and phone for public access
CREATE FUNCTION public.get_public_staff_biographies()
RETURNS TABLE (
  id uuid,
  name text,
  role text,
  biography_content text,
  image_url text,
  slug text,
  display_order integer,
  is_published boolean,
  ministry_focus text[],
  spouse_name text,
  children_count integer,
  hobbies text,
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
  WHERE is_published = true
  ORDER BY display_order ASC;
$$;

-- 4. Update profiles table RLS - restrict member access to own profile only
DROP POLICY IF EXISTS "Members can view own linked profile" ON public.profiles;

CREATE POLICY "Members can only view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 5. Revoke direct SELECT on staff_biographies for anon users (they should use the function)
REVOKE SELECT ON public.staff_biographies FROM anon;

-- 6. Grant execute on the secure function to both anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_public_staff_biographies() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_staff_biographies() TO authenticated;