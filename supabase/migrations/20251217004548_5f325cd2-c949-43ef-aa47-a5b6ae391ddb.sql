-- Add member_id to teachers table for member directory linking
ALTER TABLE public.teachers 
ADD COLUMN member_id uuid REFERENCES public.members(id) ON DELETE SET NULL;

-- Add member_id to students table for optional member linking
ALTER TABLE public.students 
ADD COLUMN member_id uuid REFERENCES public.members(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_teachers_member_id ON public.teachers(member_id);
CREATE INDEX idx_students_member_id ON public.students(member_id);