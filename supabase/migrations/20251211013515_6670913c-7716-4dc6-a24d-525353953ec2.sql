-- Create storage bucket for member files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('member-files', 'member-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create table to track member files
CREATE TABLE public.member_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.member_files ENABLE ROW LEVEL SECURITY;

-- Policies for member_files
CREATE POLICY "Administrators have full access to member files"
ON public.member_files
FOR ALL
USING (has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Editors can manage member files"
ON public.member_files
FOR ALL
USING (has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Staff can view member files"
ON public.member_files
FOR SELECT
USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Members can view files for their own profile"
ON public.member_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = member_files.member_id
    AND m.user_id = auth.uid()
  )
);

-- Storage policies for member-files bucket
CREATE POLICY "Administrators can manage member files storage"
ON storage.objects
FOR ALL
USING (bucket_id = 'member-files' AND has_role(auth.uid(), 'administrator'::app_role))
WITH CHECK (bucket_id = 'member-files' AND has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Editors can manage member files storage"
ON storage.objects
FOR ALL
USING (bucket_id = 'member-files' AND has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (bucket_id = 'member-files' AND has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Staff can view member files storage"
ON storage.objects
FOR SELECT
USING (bucket_id = 'member-files' AND has_role(auth.uid(), 'staff'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_member_files_updated_at
BEFORE UPDATE ON public.member_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();