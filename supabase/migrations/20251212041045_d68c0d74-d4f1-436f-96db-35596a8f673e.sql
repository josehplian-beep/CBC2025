-- =====================================================
-- KIDS CHECK-IN SYSTEM
-- =====================================================

-- Table to store check-in sessions (for events, services, classes)
CREATE TABLE public.checkin_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'service', -- 'service', 'class', 'event', 'group'
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  headcount INTEGER DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table to store individual check-ins
CREATE TABLE public.checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.checkin_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  guest_name TEXT, -- For guests not in the system
  security_code TEXT NOT NULL, -- Unique code for pickup matching
  checkin_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checkout_time TIMESTAMP WITH TIME ZONE,
  checked_in_by UUID,
  checked_out_by UUID,
  is_checked_out BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for child-specific information (allergies, special needs, etc.)
CREATE TABLE public.child_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  allergies TEXT[],
  medical_conditions TEXT[],
  special_needs TEXT,
  authorized_pickups TEXT[], -- Names of authorized people
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  additional_notes TEXT,
  photo_consent BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

-- Table for label templates
CREATE TABLE public.label_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'child', -- 'child', 'parent', 'visitor'
  include_fields TEXT[] DEFAULT ARRAY['name', 'class', 'security_code'],
  paper_size TEXT DEFAULT 'label_2x4', -- 'label_2x4', 'label_3x5', 'a4', 'letter'
  is_default BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.label_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checkin_sessions
CREATE POLICY "Administrators have full access to checkin sessions"
  ON public.checkin_sessions FOR ALL
  USING (has_role(auth.uid(), 'administrator'))
  WITH CHECK (has_role(auth.uid(), 'administrator'));

CREATE POLICY "Staff can manage checkin sessions"
  ON public.checkin_sessions FOR ALL
  USING (has_role(auth.uid(), 'staff'))
  WITH CHECK (has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can view all checkin sessions"
  ON public.checkin_sessions FOR SELECT
  USING (has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'administrator'));

-- RLS Policies for checkins
CREATE POLICY "Administrators have full access to checkins"
  ON public.checkins FOR ALL
  USING (has_role(auth.uid(), 'administrator'))
  WITH CHECK (has_role(auth.uid(), 'administrator'));

CREATE POLICY "Staff can manage checkins"
  ON public.checkins FOR ALL
  USING (has_role(auth.uid(), 'staff'))
  WITH CHECK (has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can view all checkins"
  ON public.checkins FOR SELECT
  USING (has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'administrator'));

-- RLS Policies for child_info
CREATE POLICY "Administrators have full access to child info"
  ON public.child_info FOR ALL
  USING (has_role(auth.uid(), 'administrator'))
  WITH CHECK (has_role(auth.uid(), 'administrator'));

CREATE POLICY "Staff can view and manage child info"
  ON public.child_info FOR ALL
  USING (has_role(auth.uid(), 'staff'))
  WITH CHECK (has_role(auth.uid(), 'staff'));

-- RLS Policies for label_templates
CREATE POLICY "Administrators have full access to label templates"
  ON public.label_templates FOR ALL
  USING (has_role(auth.uid(), 'administrator'))
  WITH CHECK (has_role(auth.uid(), 'administrator'));

CREATE POLICY "Staff can view label templates"
  ON public.label_templates FOR SELECT
  USING (has_role(auth.uid(), 'staff') OR has_role(auth.uid(), 'administrator'));

-- Create triggers for updated_at
CREATE TRIGGER update_checkin_sessions_updated_at
  BEFORE UPDATE ON public.checkin_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checkins_updated_at
  BEFORE UPDATE ON public.checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_child_info_updated_at
  BEFORE UPDATE ON public.child_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_label_templates_updated_at
  BEFORE UPDATE ON public.label_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default label templates
INSERT INTO public.label_templates (name, template_type, include_fields, is_default)
VALUES 
  ('Standard Child Label', 'child', ARRAY['name', 'class', 'security_code', 'allergies', 'date'], true),
  ('Parent Pickup Tag', 'parent', ARRAY['child_name', 'security_code', 'class'], true),
  ('Visitor Badge', 'visitor', ARRAY['name', 'date', 'location'], true);