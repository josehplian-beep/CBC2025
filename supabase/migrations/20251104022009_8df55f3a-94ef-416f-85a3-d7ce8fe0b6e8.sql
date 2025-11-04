-- Add image support and recurring dates to events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS recurring_pattern TEXT,
ADD COLUMN IF NOT EXISTS recurring_end_date DATE;

-- Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on testimonials
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Anyone can view published testimonials
CREATE POLICY "Anyone can view published testimonials"
ON public.testimonials
FOR SELECT
USING (is_published = true);

-- Admins can manage testimonials
CREATE POLICY "Admins can insert testimonials"
ON public.testimonials
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update testimonials"
ON public.testimonials
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete testimonials"
ON public.testimonials
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all testimonials"
ON public.testimonials
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();