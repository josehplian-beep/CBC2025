-- Add date of birth and church groups to members table
ALTER TABLE public.members 
ADD COLUMN date_of_birth date,
ADD COLUMN church_groups text[];

-- Add a helpful comment
COMMENT ON COLUMN public.members.church_groups IS 'Array of church groups or activities the member is involved in';