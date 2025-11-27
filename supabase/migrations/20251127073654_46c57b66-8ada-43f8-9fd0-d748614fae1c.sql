-- Add year_range column to albums table
ALTER TABLE public.albums 
ADD COLUMN IF NOT EXISTS year_range text DEFAULT '2024-2025';

-- Add index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_albums_year_range ON public.albums(year_range);

-- Add created_at index for better sorting
CREATE INDEX IF NOT EXISTS idx_albums_created_at ON public.albums(created_at DESC);