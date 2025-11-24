-- 1) Normalize roles in user_roles: convert 'admin' to 'administrator'
UPDATE public.user_roles
SET role = 'administrator'::app_role
WHERE role = 'admin'::app_role;

-- 2) Update RLS policies to use 'administrator' instead of 'admin'

-- albums
DROP POLICY IF EXISTS "Admin can delete albums" ON public.albums;
DROP POLICY IF EXISTS "Admin can insert albums" ON public.albums;
DROP POLICY IF EXISTS "Admin can update albums" ON public.albums;
DROP POLICY IF EXISTS "Admin can view all albums" ON public.albums;

CREATE POLICY "Administrator can delete albums" ON public.albums
FOR DELETE USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrator can insert albums" ON public.albums
FOR INSERT WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrator can update albums" ON public.albums
FOR UPDATE USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrator can view all albums" ON public.albums
FOR SELECT USING (has_role(auth.uid(), 'administrator'::app_role));

-- attendance_records
DROP POLICY IF EXISTS "Admin can manage all attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Staff can insert attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Staff can update recent attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Staff can view attendance" ON public.attendance_records;

CREATE POLICY "Administrator can manage all attendance" ON public.attendance_records
FOR ALL USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Staff can insert attendance" ON public.attendance_records
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'administrator'::app_role)
  OR has_role(auth.uid(), 'staff'::app_role)
);

CREATE POLICY "Staff can update recent attendance" ON public.attendance_records
FOR UPDATE USING (
  (has_role(auth.uid(), 'administrator'::app_role)
   OR has_role(auth.uid(), 'staff'::app_role))
  AND (
    has_role(auth.uid(), 'administrator'::app_role)
    OR date >= (CURRENT_DATE - INTERVAL '1 day')
  )
);

CREATE POLICY "Staff can view attendance" ON public.attendance_records
FOR SELECT USING (
  has_role(auth.uid(), 'administrator'::app_role)
  OR has_role(auth.uid(), 'staff'::app_role)
);

-- classes
DROP POLICY IF EXISTS "Admin can manage all classes" ON public.classes;
DROP POLICY IF EXISTS "Staff can view all classes" ON public.classes;

CREATE POLICY "Administrator can manage all classes" ON public.classes
FOR ALL USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Staff can view all classes" ON public.classes
FOR SELECT USING (
  has_role(auth.uid(), 'administrator'::app_role)
  OR has_role(auth.uid(), 'staff'::app_role)
);

-- department_members
DROP POLICY IF EXISTS "Admins can delete department members" ON public.department_members;
DROP POLICY IF EXISTS "Admins can insert department members" ON public.department_members;
DROP POLICY IF EXISTS "Admins can update department members" ON public.department_members;

CREATE POLICY "Administrators can delete department members" ON public.department_members
FOR DELETE USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrators can insert department members" ON public.department_members
FOR INSERT WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrators can update department members" ON public.department_members
FOR UPDATE USING (has_role(auth.uid(), 'administrator'::app_role));

-- events
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;

CREATE POLICY "Administrators can delete events" ON public.events
FOR DELETE USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrators can insert events" ON public.events
FOR INSERT WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrators can update events" ON public.events
FOR UPDATE USING (has_role(auth.uid(), 'administrator'::app_role));

-- families
DROP POLICY IF EXISTS "Admin can manage families" ON public.families;
DROP POLICY IF EXISTS "Staff and viewer can view families" ON public.families;

CREATE POLICY "Administrator can manage families" ON public.families
FOR ALL USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Staff and viewer can view families" ON public.families
FOR SELECT USING (
  has_role(auth.uid(), 'staff'::app_role)
  OR has_role(auth.uid(), 'administrator'::app_role)
  OR has_role(auth.uid(), 'viewer'::app_role)
);

-- members
DROP POLICY IF EXISTS "Admin can manage members" ON public.members;
DROP POLICY IF EXISTS "Members can view all members" ON public.members;
DROP POLICY IF EXISTS "Staff and viewer can view all members" ON public.members;

CREATE POLICY "Administrator can manage members" ON public.members
FOR ALL USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Members can view all members" ON public.members
FOR SELECT USING (has_role(auth.uid(), 'member'::app_role));

CREATE POLICY "Staff and viewer can view all members" ON public.members
FOR SELECT USING (
  has_role(auth.uid(), 'staff'::app_role)
  OR has_role(auth.uid(), 'administrator'::app_role)
  OR has_role(auth.uid(), 'viewer'::app_role)
);

-- messages
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;

CREATE POLICY "Administrators can view all messages" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'administrator'::app_role
  )
);

-- photos
DROP POLICY IF EXISTS "Admin can delete photos" ON public.photos;
DROP POLICY IF EXISTS "Admin can insert photos" ON public.photos;
DROP POLICY IF EXISTS "Admin can update photos" ON public.photos;
DROP POLICY IF EXISTS "Admin can view all photos" ON public.photos;
DROP POLICY IF EXISTS "Viewer can view all photos" ON public.photos;

CREATE POLICY "Administrator can delete photos" ON public.photos
FOR DELETE USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrator can insert photos" ON public.photos
FOR INSERT WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrator can update photos" ON public.photos
FOR UPDATE USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrator can view all photos" ON public.photos
FOR SELECT USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Viewer can view all photos" ON public.photos
FOR SELECT USING (has_role(auth.uid(), 'viewer'::app_role));

-- prayer_requests
DROP POLICY IF EXISTS "Admins can manage all prayer requests" ON public.prayer_requests;

CREATE POLICY "Administrators can manage all prayer requests" ON public.prayer_requests
FOR ALL USING (has_role(auth.uid(), 'administrator'::app_role));

-- staff_biographies
DROP POLICY IF EXISTS "Admins can delete staff biographies" ON public.staff_biographies;
DROP POLICY IF EXISTS "Admins can insert staff biographies" ON public.staff_biographies;
DROP POLICY IF EXISTS "Admins can update staff biographies" ON public.staff_biographies;
DROP POLICY IF EXISTS "Admins can view all staff biographies" ON public.staff_biographies;
DROP POLICY IF EXISTS "Viewer can view all staff biographies" ON public.staff_biographies;

CREATE POLICY "Administrators can delete staff biographies" ON public.staff_biographies
FOR DELETE USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrators can insert staff biographies" ON public.staff_biographies
FOR INSERT WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrators can update staff biographies" ON public.staff_biographies
FOR UPDATE USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrators can view all staff biographies" ON public.staff_biographies
FOR SELECT USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Viewer can view all staff biographies" ON public.staff_biographies
FOR SELECT USING (has_role(auth.uid(), 'viewer'::app_role));

-- student_classes
DROP POLICY IF EXISTS "Admin can manage student_classes" ON public.student_classes;
DROP POLICY IF EXISTS "Staff can view student_classes" ON public.student_classes;

CREATE POLICY "Administrator can manage student_classes" ON public.student_classes
FOR ALL USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Staff can view student_classes" ON public.student_classes
FOR SELECT USING (
  has_role(auth.uid(), 'administrator'::app_role)
  OR has_role(auth.uid(), 'staff'::app_role)
);

-- students
DROP POLICY IF EXISTS "Admin can manage all students" ON public.students;
DROP POLICY IF EXISTS "Staff can view all students" ON public.students;

CREATE POLICY "Administrator can manage all students" ON public.students
FOR ALL USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Staff can view all students" ON public.students
FOR SELECT USING (
  has_role(auth.uid(), 'administrator'::app_role)
  OR has_role(auth.uid(), 'staff'::app_role)
);

-- teachers
DROP POLICY IF EXISTS "Admin can manage all teachers" ON public.teachers;

CREATE POLICY "Administrator can manage all teachers" ON public.teachers
FOR ALL USING (has_role(auth.uid(), 'administrator'::app_role));

-- testimonials
DROP POLICY IF EXISTS "Admins can delete testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can insert testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can update testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can view all testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Viewer can view all testimonials" ON public.testimonials;

CREATE POLICY "Administrators can delete testimonials" ON public.testimonials
FOR DELETE USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrators can insert testimonials" ON public.testimonials
FOR INSERT WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrators can update testimonials" ON public.testimonials
FOR UPDATE USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrators can view all testimonials" ON public.testimonials
FOR SELECT USING (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Viewer can view all testimonials" ON public.testimonials
FOR SELECT USING (has_role(auth.uid(), 'viewer'::app_role));

-- profiles
DROP POLICY IF EXISTS "Staff and viewer can view all profiles" ON public.profiles;

CREATE POLICY "Staff and viewer can view all profiles" ON public.profiles
FOR SELECT USING (
  has_role(auth.uid(), 'staff'::app_role)
  OR has_role(auth.uid(), 'administrator'::app_role)
  OR has_role(auth.uid(), 'viewer'::app_role)
);

-- user_roles
DROP POLICY IF EXISTS "Admins and administrators can manage all roles" ON public.user_roles;

CREATE POLICY "Administrators can manage all roles" ON public.user_roles
FOR ALL USING (has_role(auth.uid(), 'administrator'::app_role));