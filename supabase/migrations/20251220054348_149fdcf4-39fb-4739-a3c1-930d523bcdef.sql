-- Allow anyone (including anonymous users) to view department members
CREATE POLICY "Anyone can view department members"
ON public.department_members
FOR SELECT
TO anon
USING (true);