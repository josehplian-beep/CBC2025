-- Create member_relationships table
CREATE TABLE public.member_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  related_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(member_id, related_member_id)
);

-- Enable RLS
ALTER TABLE public.member_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Administrators have full access to member relationships"
ON public.member_relationships FOR ALL
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Editors can manage member relationships"
ON public.member_relationships FOR ALL
USING (has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Staff and above can view member relationships"
ON public.member_relationships FOR SELECT
USING (
  has_role(auth.uid(), 'administrator'::app_role) OR
  has_role(auth.uid(), 'staff'::app_role) OR
  has_role(auth.uid(), 'editor'::app_role) OR
  has_role(auth.uid(), 'viewer'::app_role) OR
  has_role(auth.uid(), 'member'::app_role)
);

-- Create index for faster lookups
CREATE INDEX idx_member_relationships_member_id ON public.member_relationships(member_id);
CREATE INDEX idx_member_relationships_related_member_id ON public.member_relationships(related_member_id);