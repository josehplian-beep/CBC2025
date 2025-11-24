-- Update RLS policies to grant editors full access to members, staff, albums, and photos

-- Members table: Add editor access
CREATE POLICY "Editors can view all members"
ON public.members
FOR SELECT
USING (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can manage members"
ON public.members
FOR ALL
USING (has_role(auth.uid(), 'editor'::app_role));

-- Staff biographies table: Add editor access
CREATE POLICY "Editors can view all staff biographies"
ON public.staff_biographies
FOR SELECT
USING (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can insert staff biographies"
ON public.staff_biographies
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can update staff biographies"
ON public.staff_biographies
FOR UPDATE
USING (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can delete staff biographies"
ON public.staff_biographies
FOR DELETE
USING (has_role(auth.uid(), 'editor'::app_role));

-- Albums table: Add editor access
CREATE POLICY "Editors can view all albums"
ON public.albums
FOR SELECT
USING (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can insert albums"
ON public.albums
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can update albums"
ON public.albums
FOR UPDATE
USING (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can delete albums"
ON public.albums
FOR DELETE
USING (has_role(auth.uid(), 'editor'::app_role));

-- Photos table: Add editor access
CREATE POLICY "Editors can view all photos"
ON public.photos
FOR SELECT
USING (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can insert photos"
ON public.photos
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can update photos"
ON public.photos
FOR UPDATE
USING (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Editors can delete photos"
ON public.photos
FOR DELETE
USING (has_role(auth.uid(), 'editor'::app_role));

-- Department members table: Add editor access (already exists but ensuring completeness)
CREATE POLICY "Editors can manage department members"
ON public.department_members
FOR ALL
USING (has_role(auth.uid(), 'editor'::app_role));