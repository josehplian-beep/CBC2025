-- Grant admin access to josehplian@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('95519015-fb5a-47ab-902e-36af1b275b8a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;