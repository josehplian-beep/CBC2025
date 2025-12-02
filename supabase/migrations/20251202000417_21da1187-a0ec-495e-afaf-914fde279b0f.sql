-- Update RLS policy to restrict prayer request viewing to Administrator and Staff only
DROP POLICY IF EXISTS "Members can view all prayer requests" ON public.prayer_requests;

CREATE POLICY "Only administrators and staff can view prayer requests"
ON public.prayer_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'administrator'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);