-- Drop the overly permissive policy that includes viewers
DROP POLICY IF EXISTS "Staff and viewer can view all profiles" ON public.profiles;

-- Create a more restrictive policy for staff and administrators only
CREATE POLICY "Staff and administrators can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'administrator'::app_role)
);