-- Add new columns to profiles table for enhanced profile features
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add constraint to limit bio length
ALTER TABLE public.profiles 
ADD CONSTRAINT bio_length_check CHECK (char_length(bio) <= 500);