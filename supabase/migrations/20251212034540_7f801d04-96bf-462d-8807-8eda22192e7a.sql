-- Create member_tags table for lightweight tagging system
CREATE TABLE public.member_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create junction table for member-tag relationships
CREATE TABLE public.member_tag_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.member_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(member_id, tag_id)
);

-- Create member_custom_fields table for custom database fields
CREATE TABLE public.member_custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  field_type TEXT NOT NULL DEFAULT 'text', -- text, number, date, boolean, select
  options JSONB, -- for select type fields
  is_required BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create member_custom_field_values table for storing custom field values
CREATE TABLE public.member_custom_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.member_custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(member_id, field_id)
);

-- Create member_notes table for private notes
CREATE TABLE public.member_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.member_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for member_tags
CREATE POLICY "Anyone can view tags" ON public.member_tags FOR SELECT USING (true);
CREATE POLICY "Administrators can manage tags" ON public.member_tags FOR ALL USING (has_role(auth.uid(), 'administrator'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));
CREATE POLICY "Editors can manage tags" ON public.member_tags FOR ALL USING (has_role(auth.uid(), 'editor'::app_role)) WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

-- RLS policies for member_tag_assignments
CREATE POLICY "Staff and above can view tag assignments" ON public.member_tag_assignments FOR SELECT USING (has_role(auth.uid(), 'administrator'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'viewer'::app_role) OR has_role(auth.uid(), 'member'::app_role));
CREATE POLICY "Administrators can manage tag assignments" ON public.member_tag_assignments FOR ALL USING (has_role(auth.uid(), 'administrator'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));
CREATE POLICY "Editors can manage tag assignments" ON public.member_tag_assignments FOR ALL USING (has_role(auth.uid(), 'editor'::app_role)) WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

-- RLS policies for member_custom_fields
CREATE POLICY "Anyone can view custom fields" ON public.member_custom_fields FOR SELECT USING (true);
CREATE POLICY "Administrators can manage custom fields" ON public.member_custom_fields FOR ALL USING (has_role(auth.uid(), 'administrator'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- RLS policies for member_custom_field_values
CREATE POLICY "Staff and above can view custom field values" ON public.member_custom_field_values FOR SELECT USING (has_role(auth.uid(), 'administrator'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'viewer'::app_role) OR has_role(auth.uid(), 'member'::app_role));
CREATE POLICY "Administrators can manage custom field values" ON public.member_custom_field_values FOR ALL USING (has_role(auth.uid(), 'administrator'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));
CREATE POLICY "Editors can manage custom field values" ON public.member_custom_field_values FOR ALL USING (has_role(auth.uid(), 'editor'::app_role)) WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

-- RLS policies for member_notes
CREATE POLICY "Staff and above can view notes" ON public.member_notes FOR SELECT USING (has_role(auth.uid(), 'administrator'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Administrators can manage all notes" ON public.member_notes FOR ALL USING (has_role(auth.uid(), 'administrator'::app_role)) WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));
CREATE POLICY "Staff can manage their own notes" ON public.member_notes FOR INSERT WITH CHECK (has_role(auth.uid(), 'staff'::app_role) AND auth.uid() = created_by);
CREATE POLICY "Staff can update their own notes" ON public.member_notes FOR UPDATE USING (has_role(auth.uid(), 'staff'::app_role) AND auth.uid() = created_by);
CREATE POLICY "Staff can delete their own notes" ON public.member_notes FOR DELETE USING (has_role(auth.uid(), 'staff'::app_role) AND auth.uid() = created_by);
CREATE POLICY "Editors can manage notes" ON public.member_notes FOR ALL USING (has_role(auth.uid(), 'editor'::app_role)) WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_member_custom_field_values_updated_at
  BEFORE UPDATE ON public.member_custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_member_notes_updated_at
  BEFORE UPDATE ON public.member_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default custom fields
INSERT INTO public.member_custom_fields (name, field_type, display_order) VALUES
  ('Emergency Contact', 'text', 1),
  ('Emergency Phone', 'text', 2),
  ('T-Shirt Size', 'select', 3),
  ('Allergies', 'text', 4),
  ('Dietary Restrictions', 'text', 5);

-- Update the options for T-Shirt Size
UPDATE public.member_custom_fields 
SET options = '{"choices": ["XS", "S", "M", "L", "XL", "2XL", "3XL"]}'::jsonb 
WHERE name = 'T-Shirt Size';

-- Insert some default tags
INSERT INTO public.member_tags (name, color) VALUES
  ('Youth', '#8B5CF6'),
  ('Volunteer', '#10B981'),
  ('New Member', '#F59E0B'),
  ('Leader', '#EF4444'),
  ('Music Ministry', '#3B82F6');