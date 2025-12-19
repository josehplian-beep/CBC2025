-- Recreate the view with SECURITY INVOKER to address the linter warning
DROP VIEW IF EXISTS public.staff_biographies_public;
CREATE VIEW public.staff_biographies_public 
WITH (security_invoker = on)
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
  email,
  created_at,
  updated_at
FROM public.staff_biographies
WHERE is_published = true;