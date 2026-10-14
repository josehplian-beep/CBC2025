CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.post_comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can post a comment" ON public.post_comments FOR INSERT WITH CHECK (char_length(btrim(author_name)) BETWEEN 1 AND 80 AND char_length(btrim(content)) BETWEEN 1 AND 2000);
CREATE POLICY "Editors can delete comments" ON public.post_comments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  visitor_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, visitor_token)
);
GRANT SELECT, INSERT, DELETE ON public.post_likes TO anon;
GRANT ALL ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can like a post" ON public.post_likes FOR INSERT WITH CHECK (char_length(visitor_token) BETWEEN 8 AND 64);
CREATE POLICY "Anyone can remove a like" ON public.post_likes FOR DELETE USING (true);