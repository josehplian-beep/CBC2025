-- Create storage bucket for photo albums
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'albums',
  'albums',
  true,
  10485760, -- 10MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Create albums table
CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_published BOOLEAN DEFAULT true
);

-- Enable RLS on albums
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- Create photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on photos
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for albums
-- Everyone can view published albums
CREATE POLICY "Anyone can view published albums"
  ON public.albums
  FOR SELECT
  USING (is_published = true);

-- Admin can view all albums
CREATE POLICY "Admin can view all albums"
  ON public.albums
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert albums
CREATE POLICY "Admin can insert albums"
  ON public.albums
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can update albums
CREATE POLICY "Admin can update albums"
  ON public.albums
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete albums
CREATE POLICY "Admin can delete albums"
  ON public.albums
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for photos
-- Everyone can view photos from published albums
CREATE POLICY "Anyone can view photos from published albums"
  ON public.photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.albums
      WHERE albums.id = photos.album_id
      AND albums.is_published = true
    )
  );

-- Admin can view all photos
CREATE POLICY "Admin can view all photos"
  ON public.photos
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert photos
CREATE POLICY "Admin can insert photos"
  ON public.photos
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can update photos
CREATE POLICY "Admin can update photos"
  ON public.photos
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete photos
CREATE POLICY "Admin can delete photos"
  ON public.photos
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for albums bucket
-- Anyone can view images
CREATE POLICY "Public can view album images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'albums');

-- Admin can upload images
CREATE POLICY "Admin can upload album images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'albums' 
    AND public.has_role(auth.uid(), 'admin')
  );

-- Admin can update images
CREATE POLICY "Admin can update album images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'albums' 
    AND public.has_role(auth.uid(), 'admin')
  );

-- Admin can delete images
CREATE POLICY "Admin can delete album images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'albums' 
    AND public.has_role(auth.uid(), 'admin')
  );

-- Create trigger for albums updated_at
CREATE TRIGGER update_albums_updated_at
  BEFORE UPDATE ON public.albums
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get album photo count
CREATE OR REPLACE FUNCTION public.get_album_photo_count(album_uuid UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.photos
  WHERE album_id = album_uuid
$$;