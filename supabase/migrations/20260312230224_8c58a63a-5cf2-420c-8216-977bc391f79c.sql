ALTER TABLE public.albums ADD COLUMN slug serial UNIQUE;
UPDATE public.albums SET slug = 1 WHERE id = '4c7df197-8967-43e6-b62c-46d7c10ea515';