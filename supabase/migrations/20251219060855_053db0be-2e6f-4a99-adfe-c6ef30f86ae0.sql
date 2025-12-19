-- Fix the Security Definer View issue by recreating as SECURITY INVOKER
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
  -- Intentionally excluding: email, phone
FROM public.staff_biographies
WHERE is_published = true;

-- Grant public access to the view
GRANT SELECT ON public.staff_biographies_public TO anon, authenticated;

-- Add an RLS policy to allow public access to published staff biographies through the view
-- Since the view now uses security invoker, we need a policy on the base table for public access
CREATE POLICY "Anyone can view published staff bio public fields"
ON public.staff_biographies
FOR SELECT
USING (is_published = true);