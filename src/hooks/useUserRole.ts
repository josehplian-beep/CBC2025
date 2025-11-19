import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "staff" | "viewer" | null;

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

        if (error) {
          setRole(null);
        } else if (roles && roles.length > 0) {
          // Priority: admin > staff > viewer
          if (roles.some(r => r.role === 'admin')) {
            setRole('admin');
          } else if (roles.some(r => r.role === 'staff')) {
            setRole('staff');
          } else if (roles.some(r => r.role === 'viewer')) {
            setRole('viewer');
          }
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
    isAdmin: role === 'admin',
    isStaff: role === 'staff',
    isViewer: role === 'viewer',
    canEdit: role === 'admin' || role === 'staff',
    canDelete: role === 'admin',
    canCreate: role === 'admin' || role === 'staff',
  };
}
