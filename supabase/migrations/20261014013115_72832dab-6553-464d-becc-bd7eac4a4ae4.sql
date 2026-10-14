ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_time text;