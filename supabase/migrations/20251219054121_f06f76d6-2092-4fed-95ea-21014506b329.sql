-- Drop the existing function first since return type is changing
DROP FUNCTION IF EXISTS public.get_public_staff_biographies();

-- Recreate the function with email but WITHOUT phone
CREATE FUNCTION public.get_public_staff_biographies()
 RETURNS TABLE(id uuid, name text, role text, biography_content text, image_url text, slug text, display_order integer, is_published boolean, ministry_focus text[], spouse_name text, children_count integer, hobbies text, email text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    email,
    created_at,
    updated_at
  FROM public.staff_biographies
  WHERE is_published = true
  ORDER BY display_order ASC;
$function$;

-- Update the public view to exclude phone but include email
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
  email,
  created_at,
  updated_at
FROM public.staff_biographies
WHERE is_published = true;