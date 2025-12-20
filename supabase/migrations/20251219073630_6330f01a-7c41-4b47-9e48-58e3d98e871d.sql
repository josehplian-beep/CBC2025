-- Fix the security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.staff_biographies_public;

CREATE VIEW public.staff_biographies_public 
WITH (security_invoker = true) AS
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

-- Now we need a policy to allow public SELECT on published staff_biographies 
-- but only for the non-sensitive columns (which the view handles)
-- Since the view uses security_invoker, we need an RLS policy on the base table
CREATE POLICY "Anyone can view published staff biographies basic info"
ON public.staff_biographies
FOR SELECT
TO anon, authenticated
USING (is_published = true);