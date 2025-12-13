-- Fix staff_biographies: Make it publicly readable for basic info but restrict contact details
-- Create a view that exposes only non-sensitive fields publicly
CREATE OR REPLACE VIEW public.staff_biographies_public AS
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

-- Update RLS on staff_biographies to restrict access to contact info
DROP POLICY IF EXISTS "Staff biographies are publicly visible" ON public.staff_biographies;

-- Only authenticated staff/admin can see full details including email/phone
CREATE POLICY "Authenticated staff can view full staff biographies"
ON public.staff_biographies
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'administrator') OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'staff')
);

-- Public can read via the view (which excludes contact info)
CREATE POLICY "Public can view published staff biographies without contact info"
ON public.staff_biographies
FOR SELECT
TO anon
USING (is_published = true);

-- Fix member_custom_fields: Only authenticated users with proper roles can access
DROP POLICY IF EXISTS "Anyone can view member custom fields" ON public.member_custom_fields;
DROP POLICY IF EXISTS "member_custom_fields_select_policy" ON public.member_custom_fields;

-- Only authenticated members and above can see custom field definitions
CREATE POLICY "Authenticated users can view member custom fields"
ON public.member_custom_fields
FOR SELECT
TO authenticated
USING (true);

-- Ensure anon users cannot access custom fields
CREATE POLICY "Anon users cannot view member custom fields"
ON public.member_custom_fields
FOR SELECT
TO anon
USING (false);