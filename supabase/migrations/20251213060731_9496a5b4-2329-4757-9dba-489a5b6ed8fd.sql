-- Remove policies that allow anonymous/public access to the full staff_biographies table
DROP POLICY IF EXISTS "Anyone can view published staff biographies" ON public.staff_biographies;
DROP POLICY IF EXISTS "Public can view published staff biographies without contact inf" ON public.staff_biographies;

-- Anonymous users should use the staff_biographies_public VIEW (which excludes email/phone)
-- The view already exists and excludes contact info