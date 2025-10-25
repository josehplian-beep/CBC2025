-- Create department_members table
CREATE TABLE public.department_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  profile_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.department_members ENABLE ROW LEVEL SECURITY;

-- Create policies for department_members
CREATE POLICY "Anyone can view department members"
ON public.department_members
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert department members"
ON public.department_members
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update department members"
ON public.department_members
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete department members"
ON public.department_members
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_department_members_updated_at
BEFORE UPDATE ON public.department_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for department profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('department-profiles', 'department-profiles', true);

-- Create storage policies for department profile pictures
CREATE POLICY "Anyone can view department profile images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'department-profiles');

CREATE POLICY "Admins can upload department profile images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'department-profiles' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update department profile images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'department-profiles' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete department profile images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'department-profiles' 
  AND has_role(auth.uid(), 'admin'::app_role)
);