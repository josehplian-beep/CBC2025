-- Drop the existing function first, then recreate with email included
DROP FUNCTION IF EXISTS public.get_public_staff_biographies();

CREATE FUNCTION public.get_public_staff_biographies()
RETURNS TABLE (
  id uuid,
  name text,
  role text,
  email text,
  biography_content text,
  image_url text,
  slug text,
  display_order integer,
  is_published boolean,
  ministry_focus text[],
  spouse_name text,
  children_count integer,
  hobbies text,
  created_at timestamptz,
  updated_at timestamptz
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
    email,
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

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_staff_biographies() TO anon, authenticated;