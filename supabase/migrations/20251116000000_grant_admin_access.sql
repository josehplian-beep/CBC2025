-- Create a function to grant admin access by email
CREATE OR REPLACE FUNCTION public.grant_admin_by_email(_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the user ID for the email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = _email;

  -- If user exists, grant admin role
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN 'Admin role granted to ' || _email;
  ELSE
    RETURN 'User ' || _email || ' not found. They need to sign up first.';
  END IF;
END $$;

-- Grant admin role to chinbethelchurchdc2010@gmail.com
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the user ID for the email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'chinbethelchurchdc2010@gmail.com';

  -- If user exists, grant admin role
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role granted to chinbethelchurchdc2010@gmail.com';
  ELSE
    RAISE NOTICE 'User chinbethelchurchdc2010@gmail.com not found. They need to sign up first.';
  END IF;
END $$;
