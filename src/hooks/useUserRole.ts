import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { UserRole as AppUserRole } from "@/lib/permissions";

export type UserRole = AppUserRole | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);

        if (error || !roles || roles.length === 0) {
          setRole(null);
          return;
        }

        const roleValues = roles.map(r => r.role as AppUserRole);

        // Priority: administrator > staff > editor > teacher > member > viewer
        // Note: 'admin' is legacy and should not exist in the database anymore
        if (roleValues.includes('administrator')) {
          setRole('administrator');
        } else if (roleValues.includes('staff')) {
          setRole('staff');
        } else if (roleValues.includes('editor')) {
          setRole('editor');
        } else if (roleValues.includes('teacher')) {
          setRole('teacher');
        } else if (roleValues.includes('member')) {
          setRole('member');
        } else if (roleValues.includes('viewer')) {
          setRole('viewer');
        } else if (roleValues.includes('admin')) {
          // Legacy fallback - this should not happen
          setRole('admin');
        } else {
          setRole(null);
        }
      } catch (error) {
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    role,
    loading,
    isAdmin: role === 'administrator',
    isStaff: role === 'staff',
    isViewer: role === 'viewer',
    canEdit: role === 'administrator' || role === 'staff',
    canDelete: role === 'administrator',
    canCreate: role === 'administrator' || role === 'staff',
  };
}
