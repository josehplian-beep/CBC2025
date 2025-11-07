-- Create staff_biographies table
CREATE TABLE public.staff_biographies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  name text NOT NULL,
  role text NOT NULL,
  email text,
  phone text,
  image_url text,
  biography_content text NOT NULL,
  ministry_focus text[],
  spouse_name text,
  children_count integer,
  hobbies text,
  slug text NOT NULL UNIQUE,
  display_order integer DEFAULT 0,
  is_published boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.staff_biographies ENABLE ROW LEVEL SECURITY;

-- Anyone can view published staff biographies
CREATE POLICY "Anyone can view published staff biographies"
ON public.staff_biographies
FOR SELECT
USING (is_published = true);

-- Admins can view all staff biographies
CREATE POLICY "Admins can view all staff biographies"
ON public.staff_biographies
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert staff biographies
CREATE POLICY "Admins can insert staff biographies"
ON public.staff_biographies
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update staff biographies
CREATE POLICY "Admins can update staff biographies"
ON public.staff_biographies
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete staff biographies
CREATE POLICY "Admins can delete staff biographies"
ON public.staff_biographies
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_staff_biographies_updated_at
  BEFORE UPDATE ON public.staff_biographies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();