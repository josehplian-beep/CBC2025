-- Fix Function Search Path Mutable security warning
-- Add search_path to the generate_recurring_events function

CREATE OR REPLACE FUNCTION public.generate_recurring_events(
  p_event_id uuid, 
  p_title text, 
  p_description text, 
  p_start_date date, 
  p_end_date date, 
  p_time text, 
  p_location text, 
  p_type text, 
  p_recurring_pattern text, 
  p_image_url text DEFAULT NULL::text, 
  p_created_by uuid DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_current_date date;
  v_date_string text;
BEGIN
  -- Delete existing instances if regenerating
  DELETE FROM public.events
  WHERE parent_event_id = p_event_id;
  
  v_current_date := p_start_date;
  
  -- Generate instances based on pattern
  WHILE v_current_date <= p_end_date LOOP
    -- Skip the first date as it's the parent event
    IF v_current_date > p_start_date THEN
      v_date_string := to_char(v_current_date, 'FMMonth DD, YYYY');
      
      INSERT INTO public.events (
        title,
        description,
        date,
        date_obj,
        time,
        location,
        type,
        image_url,
        created_by,
        parent_event_id,
        recurring_pattern,
        recurring_end_date
      ) VALUES (
        p_title,
        p_description,
        v_date_string,
        v_current_date::timestamp with time zone,
        p_time,
        p_location,
        p_type,
        p_image_url,
        p_created_by,
        p_event_id,
        p_recurring_pattern,
        p_end_date
      );
    END IF;
    
    -- Increment date based on pattern
    CASE p_recurring_pattern
      WHEN 'weekly' THEN
        v_current_date := v_current_date + INTERVAL '1 week';
      WHEN 'biweekly' THEN
        v_current_date := v_current_date + INTERVAL '2 weeks';
      WHEN 'monthly' THEN
        v_current_date := v_current_date + INTERVAL '1 month';
      WHEN 'yearly' THEN
        v_current_date := v_current_date + INTERVAL '1 year';
      ELSE
        EXIT; -- Stop if pattern is not recognized
    END CASE;
  END LOOP;
END;
$function$;