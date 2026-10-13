ALTER TABLE public.testimonials ADD COLUMN content_type text NOT NULL DEFAULT 'testimony', ADD COLUMN slug text;
CREATE UNIQUE INDEX testimonials_slug_unique ON public.testimonials(slug) WHERE slug IS NOT NULL;
CREATE OR REPLACE FUNCTION public.validate_message_post() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.content_type NOT IN ('testimony','rooted_thought') THEN RAISE EXCEPTION 'Invalid message section'; END IF;
 IF NEW.content_type = 'rooted_thought' THEN
  IF NEW.slug IS NULL OR trim(NEW.slug) = '' THEN NEW.slug := public.slugify_event(NEW.title) || '-' || substr(NEW.id::text,1,8); END IF;
  IF NEW.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN RAISE EXCEPTION 'Post link must contain lowercase letters, numbers and hyphens'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_message_post BEFORE INSERT OR UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.validate_message_post();
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
CREATE POLICY "Editors can manage message posts" ON public.testimonials FOR ALL TO authenticated USING (public.has_role(auth.uid(),'editor')) WITH CHECK (public.has_role(auth.uid(),'editor'));
CREATE POLICY "Editors can upload message images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='albums' AND public.has_role(auth.uid(),'editor') AND name LIKE 'message-%');