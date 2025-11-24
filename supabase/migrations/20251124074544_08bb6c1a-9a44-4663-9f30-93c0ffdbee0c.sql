-- Add new role values to the existing enum without dropping it
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'administrator';

-- Note: We'll keep 'admin' and 'viewer' for backward compatibility
-- The application code will handle the mapping