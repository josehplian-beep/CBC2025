-- Fix the security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.staff_biographies_public;

CREATE VIEW public.staff_biographies_public
WITH (security_invoker = true)
AS
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

-- Grant access to the view
GRANT SELECT ON public.staff_biographies_public TO anon, authenticated;