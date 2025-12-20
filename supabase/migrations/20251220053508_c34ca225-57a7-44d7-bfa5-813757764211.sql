-- Fix: Remove public access to department_members and require authentication

-- Drop the public access policy
DROP POLICY IF EXISTS "Anyone can view department members" ON public.department_members;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can view department members"
ON public.department_members
FOR SELECT
TO authenticated
USING (true);