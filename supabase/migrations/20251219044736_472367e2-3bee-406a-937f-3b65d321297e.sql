-- Create function to auto-assign Children tag based on age
CREATE OR REPLACE FUNCTION public.auto_assign_children_tag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_children_tag_id uuid;
  v_member_age integer;
BEGIN
  -- Get the Children tag id
  SELECT id INTO v_children_tag_id FROM public.member_tags WHERE name = 'Children' LIMIT 1;
  
  -- If Children tag doesn't exist, exit
  IF v_children_tag_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate age from date_of_birth
  IF NEW.date_of_birth IS NOT NULL THEN
    v_member_age := EXTRACT(YEAR FROM age(CURRENT_DATE, NEW.date_of_birth));
    
    IF v_member_age < 18 THEN
      -- Member is under 18, assign Children tag if not already assigned
      INSERT INTO public.member_tag_assignments (member_id, tag_id)
      VALUES (NEW.id, v_children_tag_id)
      ON CONFLICT DO NOTHING;
    ELSE
      -- Member is 18 or older, remove Children tag if assigned
      DELETE FROM public.member_tag_assignments 
      WHERE member_id = NEW.id AND tag_id = v_children_tag_id;
    END IF;
  ELSE
    -- No date of birth, remove Children tag if assigned
    DELETE FROM public.member_tag_assignments 
    WHERE member_id = NEW.id AND tag_id = v_children_tag_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on members table
DROP TRIGGER IF EXISTS auto_assign_children_tag_trigger ON public.members;
CREATE TRIGGER auto_assign_children_tag_trigger
  AFTER INSERT OR UPDATE OF date_of_birth ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_children_tag();

-- Add unique constraint to prevent duplicate tag assignments
ALTER TABLE public.member_tag_assignments 
ADD CONSTRAINT unique_member_tag UNIQUE (member_id, tag_id);

-- Apply Children tag to existing members under 18
INSERT INTO public.member_tag_assignments (member_id, tag_id)
SELECT m.id, t.id
FROM public.members m
CROSS JOIN public.member_tags t
WHERE t.name = 'Children'
  AND m.date_of_birth IS NOT NULL
  AND EXTRACT(YEAR FROM age(CURRENT_DATE, m.date_of_birth)) < 18
ON CONFLICT ON CONSTRAINT unique_member_tag DO NOTHING;