-- Grant teachers access to view members
CREATE POLICY "Teachers can view all members"
ON public.members
FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role));