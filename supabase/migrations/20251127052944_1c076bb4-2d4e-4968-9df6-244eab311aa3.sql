-- Update all existing 'admin' roles to 'administrator'
UPDATE public.user_roles 
SET role = 'administrator'::app_role 
WHERE role = 'admin'::app_role;

-- Update all RLS policies to ensure administrators have full access
-- Members table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrator can manage members" ON public.members;
DROP POLICY IF EXISTS "Admin can manage members" ON public.members;

CREATE POLICY "Administrators have full access to members"
ON public.members
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- Profiles table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrator can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

CREATE POLICY "Administrators have full access to profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- Events table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrators can delete events" ON public.events;
DROP POLICY IF EXISTS "Administrators can insert events" ON public.events;
DROP POLICY IF EXISTS "Administrators can update events" ON public.events;
DROP POLICY IF EXISTS "Administrators can manage events" ON public.events;

CREATE POLICY "Administrators have full access to events"
ON public.events
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- Albums table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrator can delete albums" ON public.albums;
DROP POLICY IF EXISTS "Administrator can insert albums" ON public.albums;
DROP POLICY IF EXISTS "Administrator can update albums" ON public.albums;
DROP POLICY IF EXISTS "Administrator can view all albums" ON public.albums;
DROP POLICY IF EXISTS "Administrators can manage albums" ON public.albums;

CREATE POLICY "Administrators have full access to albums"
ON public.albums
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- Photos table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrator can delete photos" ON public.photos;
DROP POLICY IF EXISTS "Administrator can insert photos" ON public.photos;
DROP POLICY IF EXISTS "Administrator can update photos" ON public.photos;
DROP POLICY IF EXISTS "Administrator can view all photos" ON public.photos;
DROP POLICY IF EXISTS "Administrators can manage photos" ON public.photos;

CREATE POLICY "Administrators have full access to photos"
ON public.photos
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- Testimonials table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrators can delete testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Administrators can insert testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Administrators can update testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Administrators can view all testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Administrators can manage testimonials" ON public.testimonials;

CREATE POLICY "Administrators have full access to testimonials"
ON public.testimonials
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- Staff biographies table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrators can delete staff biographies" ON public.staff_biographies;
DROP POLICY IF EXISTS "Administrators can insert staff biographies" ON public.staff_biographies;
DROP POLICY IF EXISTS "Administrators can update staff biographies" ON public.staff_biographies;
DROP POLICY IF EXISTS "Administrators can view all staff biographies" ON public.staff_biographies;
DROP POLICY IF EXISTS "Administrators can manage staff biographies" ON public.staff_biographies;

CREATE POLICY "Administrators have full access to staff biographies"
ON public.staff_biographies
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- Department members table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrators can delete department members" ON public.department_members;
DROP POLICY IF EXISTS "Administrators can insert department members" ON public.department_members;
DROP POLICY IF EXISTS "Administrators can update department members" ON public.department_members;
DROP POLICY IF EXISTS "Administrators can manage department members" ON public.department_members;

CREATE POLICY "Administrators have full access to department members"
ON public.department_members
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- Prayer requests table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrators can manage all prayer requests" ON public.prayer_requests;
DROP POLICY IF EXISTS "Administrators can manage prayer requests" ON public.prayer_requests;

CREATE POLICY "Administrators have full access to prayer requests"
ON public.prayer_requests
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- Families table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrator can manage families" ON public.families;
DROP POLICY IF EXISTS "Administrators can manage families" ON public.families;

CREATE POLICY "Administrators have full access to families"
ON public.families
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- Classes table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrator can manage all classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators can manage classes" ON public.classes;

CREATE POLICY "Administrators have full access to classes"
ON public.classes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- Students table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrator can manage all students" ON public.students;
DROP POLICY IF EXISTS "Administrators can manage students" ON public.students;

CREATE POLICY "Administrators have full access to students"
ON public.students
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- Teachers table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrator can manage all teachers" ON public.teachers;
DROP POLICY IF EXISTS "Administrators can manage teachers" ON public.teachers;

CREATE POLICY "Administrators have full access to teachers"
ON public.teachers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- Attendance records table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrator can manage all attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Administrators can manage attendance" ON public.attendance_records;

CREATE POLICY "Administrators have full access to attendance"
ON public.attendance_records
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- Student classes table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrator can manage student_classes" ON public.student_classes;
DROP POLICY IF EXISTS "Administrators can manage student_classes" ON public.student_classes;

CREATE POLICY "Administrators have full access to student classes"
ON public.student_classes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

-- User roles table - consolidate administrator policies
DROP POLICY IF EXISTS "Administrators can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Administrators can manage roles" ON public.user_roles;

CREATE POLICY "Administrators have full access to roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));