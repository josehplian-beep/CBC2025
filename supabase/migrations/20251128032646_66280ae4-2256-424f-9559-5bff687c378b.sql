-- Add baptized column to members table
ALTER TABLE public.members
ADD COLUMN baptized boolean DEFAULT false;