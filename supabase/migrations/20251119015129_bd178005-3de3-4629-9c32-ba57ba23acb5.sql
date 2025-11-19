-- Create prayer_requests table
CREATE TABLE public.prayer_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  is_answered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for prayer requests
CREATE POLICY "Members can view all prayer requests"
  ON public.prayer_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'member'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'viewer'::app_role));

CREATE POLICY "Members can insert their own prayer requests"
  ON public.prayer_requests
  FOR INSERT
  WITH CHECK (auth.uid() = author_id AND (has_role(auth.uid(), 'member'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

CREATE POLICY "Members can update their own prayer requests"
  ON public.prayer_requests
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Members can delete their own prayer requests"
  ON public.prayer_requests
  FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all prayer requests"
  ON public.prayer_requests
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_prayer_requests_updated_at
  BEFORE UPDATE ON public.prayer_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();