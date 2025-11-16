-- Add gender and position fields to members table
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS profile_image_url text,
ADD COLUMN IF NOT EXISTS position text,
ADD COLUMN IF NOT EXISTS ministry text,
ADD COLUMN IF NOT EXISTS service_year text;