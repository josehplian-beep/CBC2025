-- Fix the "Editors can manage members" policy to include proper with_check clause
DROP POLICY IF EXISTS "Editors can manage members" ON public.members;

CREATE POLICY "Editors can manage members" 
ON public.members 
FOR ALL 
USING (has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (has_role(auth.uid(), 'editor'::app_role));