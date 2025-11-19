-- Update RLS policies for public prayer request submissions

-- Drop the existing insert policy that required authentication
DROP POLICY IF EXISTS "Members can insert their own prayer requests" ON public.prayer_requests;

-- Create new policy to allow anyone to submit prayer requests
CREATE POLICY "Anyone can submit prayer requests"
  ON public.prayer_requests
  FOR INSERT
  WITH CHECK (true);

-- Keep viewing restricted to authenticated users with proper roles
-- (existing SELECT policies remain unchanged)

-- Update the table to make author_id nullable for anonymous submissions
ALTER TABLE public.prayer_requests 
  ALTER COLUMN author_id DROP NOT NULL;