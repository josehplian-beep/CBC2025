-- Update RLS policies for members table to include viewer
DROP POLICY IF EXISTS "Staff can view all members" ON public.members;
CREATE POLICY "Staff and viewer can view all members" 
ON public.members 
FOR SELECT 
USING (
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'viewer'::app_role)
);

-- Update RLS policies for profiles table to include viewer
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff and viewer can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'viewer'::app_role)
);

-- Viewer can view albums (both published and unpublished)
CREATE POLICY "Viewer can view all albums" 
ON public.albums 
FOR SELECT 
USING (has_role(auth.uid(), 'viewer'::app_role));

-- Viewer can view all photos
CREATE POLICY "Viewer can view all photos" 
ON public.photos 
FOR SELECT 
USING (has_role(auth.uid(), 'viewer'::app_role));

-- Viewer can view all testimonials
CREATE POLICY "Viewer can view all testimonials" 
ON public.testimonials 
FOR SELECT 
USING (has_role(auth.uid(), 'viewer'::app_role));

-- Viewer can view all staff biographies
CREATE POLICY "Viewer can view all staff biographies" 
ON public.staff_biographies 
FOR SELECT 
USING (has_role(auth.uid(), 'viewer'::app_role));

-- Viewer can view department members
CREATE POLICY "Viewer can view department members" 
ON public.department_members 
FOR SELECT 
USING (has_role(auth.uid(), 'viewer'::app_role));

-- Viewer can view events
CREATE POLICY "Viewer can view all events" 
ON public.events 
FOR SELECT 
USING (has_role(auth.uid(), 'viewer'::app_role));