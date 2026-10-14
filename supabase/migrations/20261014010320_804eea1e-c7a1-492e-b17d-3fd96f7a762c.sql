DROP POLICY "Authors can read their own message posts" ON public.testimonials;
DROP POLICY "Authors can edit their own message posts" ON public.testimonials;

CREATE POLICY "Authors can read all message posts"
ON public.testimonials FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'author'));

CREATE POLICY "Authors can edit all message posts"
ON public.testimonials FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'author'))
WITH CHECK (public.has_role(auth.uid(), 'author') AND content_type IN ('testimony', 'rooted_thought'));