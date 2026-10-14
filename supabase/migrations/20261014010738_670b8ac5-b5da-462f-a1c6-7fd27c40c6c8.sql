-- Trigger-only functions: no API caller should ever invoke these directly
REVOKE EXECUTE ON FUNCTION public.auto_assign_children_tag() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Role helpers are only needed by signed-in users (RLS policies run as the caller)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_teacher_of_class(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_teacher_of_class(uuid, uuid) TO authenticated;

-- Recurring-event generator is invoked from the admin event dialog (signed-in editors)
REVOKE EXECUTE ON FUNCTION public.generate_recurring_events(uuid, text, text, date, date, text, text, text, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_recurring_events(uuid, text, text, date, date, text, text, text, text, text, uuid) TO authenticated;

-- Public directory functions are intentionally callable by everyone (public staff/teachers pages)
GRANT EXECUTE ON FUNCTION public.get_public_staff_biographies() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_teachers() TO anon, authenticated;