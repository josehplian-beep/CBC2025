-- Grant administrator access to josehplian@gmail.com
-- User ID: 95519015-fb5a-47ab-902e-36af1b275b8a

-- First, remove the old 'admin' role if it exists
DELETE FROM public.user_roles 
WHERE user_id = '95519015-fb5a-47ab-902e-36af1b275b8a' 
AND role = 'admin';

-- Grant administrator role (used by the new RLS policies)
INSERT INTO public.user_roles (user_id, role)
VALUES ('95519015-fb5a-47ab-902e-36af1b275b8a', 'administrator')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also grant editor role for maximum flexibility
INSERT INTO public.user_roles (user_id, role)
VALUES ('95519015-fb5a-47ab-902e-36af1b275b8a', 'editor')
ON CONFLICT (user_id, role) DO NOTHING;
