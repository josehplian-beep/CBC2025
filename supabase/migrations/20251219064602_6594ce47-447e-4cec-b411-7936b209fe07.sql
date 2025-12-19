-- Allow members to update their own linked member record
CREATE POLICY "Members can update their own linked member record"
ON public.members
FOR UPDATE
USING (
  has_role(auth.uid(), 'member'::app_role) AND user_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'member'::app_role) AND user_id = auth.uid()
);