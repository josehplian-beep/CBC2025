CREATE TABLE public.devotional_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT devotional_subscribers_email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 255)
);
CREATE UNIQUE INDEX devotional_subscribers_email_key ON public.devotional_subscribers (lower(email));
GRANT INSERT ON public.devotional_subscribers TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.devotional_subscribers TO authenticated;
GRANT ALL ON public.devotional_subscribers TO service_role;
ALTER TABLE public.devotional_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.devotional_subscribers FOR INSERT TO anon, authenticated WITH CHECK (is_active = true);
CREATE POLICY "Admins can view subscribers" ON public.devotional_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage subscribers" ON public.devotional_subscribers FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can remove subscribers" ON public.devotional_subscribers FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));