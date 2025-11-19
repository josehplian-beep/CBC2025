-- Add fixed search_path to update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add fixed search_path to get_album_photo_count function
CREATE OR REPLACE FUNCTION public.get_album_photo_count(album_uuid UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.photos
  WHERE album_id = album_uuid
$$;