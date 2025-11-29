-- Create a security definer function to check if a teacher is assigned to a class
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(_teacher_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_teachers
    WHERE teacher_id = _teacher_id
      AND class_id = _class_id
  );
$$;

-- Drop the old policy and create a more restrictive one for teachers
DROP POLICY IF EXISTS "Staff can insert attendance" ON public.attendance_records;

-- Teachers can only insert attendance for their assigned classes
CREATE POLICY "Teachers can insert attendance for assigned classes"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'administrator'::app_role) OR
  (
    has_role(auth.uid(), 'staff'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE id = taken_by
        AND public.is_teacher_of_class(taken_by, class_id)
    )
  )
);

-- Teachers can only update recent attendance for their assigned classes
DROP POLICY IF EXISTS "Staff can update recent attendance" ON public.attendance_records;

CREATE POLICY "Teachers can update recent attendance for assigned classes"
ON public.attendance_records
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'administrator'::app_role) OR
  (
    has_role(auth.uid(), 'staff'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE id = taken_by
        AND public.is_teacher_of_class(taken_by, class_id)
    ) AND
    (has_role(auth.uid(), 'administrator'::app_role) OR (date >= (CURRENT_DATE - '1 day'::interval)))
  )
);

-- Teachers can only view attendance for their assigned classes
DROP POLICY IF EXISTS "Staff can view attendance" ON public.attendance_records;

CREATE POLICY "Teachers can view attendance for assigned classes"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'administrator'::app_role) OR
  (
    has_role(auth.uid(), 'staff'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE id = taken_by
        AND public.is_teacher_of_class(taken_by, class_id)
    )
  )
);