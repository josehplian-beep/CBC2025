-- Add user_id column to members table to link with auth users
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create unique index to ensure one user per member
CREATE UNIQUE INDEX IF NOT EXISTS members_user_id_key ON public.members(user_id) WHERE user_id IS NOT NULL;

-- Update RLS policies for members table to allow members to view each other
CREATE POLICY "Members can view all members"
ON public.members
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'member'::app_role));

-- Allow members to view their own profile data
CREATE POLICY "Members can view own linked profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'member'::app_role) 
  OR auth.uid() = user_id
);