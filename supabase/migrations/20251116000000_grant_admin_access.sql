-- Grant admin access to chinbethelchurchdc2010@gmail.com
-- User ID: d5af2fb7-180a-4144-b03a-700fe2c4ee04

DO $$
BEGIN
  -- Delete any existing roles first to avoid conflicts
  DELETE FROM public.user_roles WHERE user_id = 'd5af2fb7-180a-4144-b03a-700fe2c4ee04';
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES ('d5af2fb7-180a-4144-b03a-700fe2c4ee04', 'admin'::app_role);
  
  RAISE NOTICE 'Admin role granted to user d5af2fb7-180a-4144-b03a-700fe2c4ee04';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error granting admin role: %', SQLERRM;
END $$;
