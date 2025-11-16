-- Create families table for grouping members
CREATE TABLE public.families (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_name text NOT NULL,
  street_address text NOT NULL,
  street_address_line2 text,
  city text NOT NULL,
  county text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on families table
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Add family_id column to members table
ALTER TABLE public.members ADD COLUMN family_id uuid REFERENCES public.families(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_members_family_id ON public.members(family_id);

-- RLS Policies for families table
CREATE POLICY "Admin can manage families"
ON public.families
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff and viewer can view families"
ON public.families
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'viewer'::app_role)
);

-- Trigger to update updated_at on families
CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();