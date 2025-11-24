-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create new policy that checks for both admin and administrator roles
CREATE POLICY "Admins and administrators can manage all roles"
ON public.user_roles
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'administrator'::app_role)
);