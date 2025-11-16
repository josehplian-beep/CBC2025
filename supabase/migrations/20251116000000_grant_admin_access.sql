-- Grant admin role to chinbethelchurchdc2010@gmail.com
-- This migration will run after the user signs up

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
