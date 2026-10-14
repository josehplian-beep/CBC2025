CREATE POLICY "Authors can read their own message posts" ON public.testimonials FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'author') AND created_by = auth.uid());
CREATE POLICY "Authors can create message posts" ON public.testimonials FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'author') AND created_by = auth.uid() AND content_type IN ('testimony','rooted_thought'));
CREATE POLICY "Authors can edit their own message posts" ON public.testimonials FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'author') AND created_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'author') AND created_by = auth.uid() AND content_type IN ('testimony','rooted_thought'));
CREATE POLICY "Authors can upload message images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'albums' AND public.has_role(auth.uid(), 'author') AND name LIKE 'message-%');