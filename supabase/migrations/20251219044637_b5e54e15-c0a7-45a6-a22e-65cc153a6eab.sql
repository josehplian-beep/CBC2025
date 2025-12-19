-- Add "Children" tag to member_tags table if it doesn't exist
INSERT INTO public.member_tags (name, color)
SELECT 'Children', '#F97316'
WHERE NOT EXISTS (
  SELECT 1 FROM public.member_tags WHERE name = 'Children'
);