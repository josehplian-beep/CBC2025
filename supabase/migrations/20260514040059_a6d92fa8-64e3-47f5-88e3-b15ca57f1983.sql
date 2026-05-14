
-- Add slug column for short, custom event URLs
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS slug text;

-- Helper to slugify a title
CREATE OR REPLACE FUNCTION public.slugify_event(_title text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' from
           regexp_replace(
             regexp_replace(lower(coalesce(_title, 'event')), '[^a-z0-9]+', '-', 'g'),
             '-+', '-', 'g'
           )
         );
$$;

-- Backfill slugs for existing rows (append short id to ensure uniqueness)
UPDATE public.events
SET slug = public.slugify_event(title) || '-' || substr(id::text, 1, 6)
WHERE slug IS NULL OR slug = '';

-- Unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_unique ON public.events (slug) WHERE slug IS NOT NULL;

-- Auto-generate slug on insert/update if missing
CREATE OR REPLACE FUNCTION public.set_event_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  n int := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := public.slugify_event(NEW.title);
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = candidate AND id <> NEW.id) LOOP
      n := n + 1;
      candidate := base || '-' || n::text;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_event_slug ON public.events;
CREATE TRIGGER trg_set_event_slug
BEFORE INSERT OR UPDATE OF title, slug ON public.events
FOR EACH ROW EXECUTE FUNCTION public.set_event_slug();
