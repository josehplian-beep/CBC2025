-- Create junction table for class-teacher assignments (supports multiple teachers per class)
CREATE TABLE IF NOT EXISTS public.class_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_id, teacher_id)
);

-- Enable RLS
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

-- Migrate existing teacher assignments from classes table
INSERT INTO public.class_teachers (class_id, teacher_id)
SELECT id, teacher_id 
FROM public.classes 
WHERE teacher_id IS NOT NULL
ON CONFLICT (class_id, teacher_id) DO NOTHING;

-- RLS Policies for class_teachers
CREATE POLICY "Administrators have full access to class_teachers"
  ON public.class_teachers
  FOR ALL
  USING (has_role(auth.uid(), 'administrator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Staff can view class_teachers"
  ON public.class_teachers
  FOR SELECT
  USING (has_role(auth.uid(), 'administrator'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Anyone can view class_teachers"
  ON public.class_teachers
  FOR SELECT
  USING (true);