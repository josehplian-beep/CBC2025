-- Give editors access to view families table
CREATE POLICY "Editors can view all families"
ON public.families
FOR SELECT
USING (has_role(auth.uid(), 'editor'::app_role));