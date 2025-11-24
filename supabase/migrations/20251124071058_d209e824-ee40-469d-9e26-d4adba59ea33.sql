-- Create teachers table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  photo_url TEXT,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create student_classes junction table
CREATE TABLE public.student_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  year TEXT NOT NULL DEFAULT '2024-2025',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, class_id, year)
);

-- Create attendance_records table
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
  notes TEXT,
  taken_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, class_id, date)
);

-- Enable RLS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teachers
CREATE POLICY "Admin can manage all teachers"
ON public.teachers FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view teachers"
ON public.teachers FOR SELECT
USING (true);

-- RLS Policies for students
CREATE POLICY "Admin can manage all students"
ON public.students FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view all students"
ON public.students FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- RLS Policies for classes
CREATE POLICY "Admin can manage all classes"
ON public.classes FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view all classes"
ON public.classes FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- RLS Policies for student_classes
CREATE POLICY "Admin can manage student_classes"
ON public.student_classes FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view student_classes"
ON public.student_classes FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

-- RLS Policies for attendance_records
CREATE POLICY "Admin can manage all attendance"
ON public.attendance_records FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view attendance"
ON public.attendance_records FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can insert attendance"
ON public.attendance_records FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can update recent attendance"
ON public.attendance_records FOR UPDATE
USING (
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
  AND (has_role(auth.uid(), 'admin') OR date >= CURRENT_DATE - INTERVAL '1 day')
);

-- Create indexes for better performance
CREATE INDEX idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX idx_student_classes_student ON public.student_classes(student_id);
CREATE INDEX idx_student_classes_class ON public.student_classes(class_id);
CREATE INDEX idx_attendance_student ON public.attendance_records(student_id);
CREATE INDEX idx_attendance_class ON public.attendance_records(class_id);
CREATE INDEX idx_attendance_date ON public.attendance_records(date);

-- Add triggers for updated_at
CREATE TRIGGER update_teachers_updated_at
BEFORE UPDATE ON public.teachers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();