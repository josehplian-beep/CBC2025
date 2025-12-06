/**
 * useUserRole Hook
 * 
 * A custom React hook for managing user role-based authentication.
 * Fetches the current user's role from Supabase and provides
 * convenient boolean flags for permission checks.
 * 
 * @example
 * ```tsx
 * const { role, isAdmin, canEdit, loading } = useUserRole();
 * 
 * if (loading) return <Spinner />;
 * if (!canEdit) return <AccessDenied />;
 * ```
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { UserRole as AppUserRole } from "@/lib/permissions";

// ============================================================================
// Types
// ============================================================================

export type UserRole = AppUserRole | null;

interface UserRoleState {
  /** Current user's role, or null if not authenticated */
  role: UserRole;
  /** Whether the role is still being fetched */
  loading: boolean;
  /** True if user has 'administrator' role */
  isAdmin: boolean;
  /** True if user has 'staff' role */
  isStaff: boolean;
  /** True if user has 'viewer' role */
  isViewer: boolean;
  /** True if user can edit content (administrator or staff) */
  canEdit: boolean;
  /** True if user can delete content (administrator only) */
  canDelete: boolean;
  /** True if user can create content (administrator or staff) */
  canCreate: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Role priority order from highest to lowest.
 * When a user has multiple roles, the highest priority role is used.
 */
const ROLE_PRIORITY: readonly AppUserRole[] = [
  'administrator',
  'staff',
  'editor',
  'teacher',
  'member',
  'viewer',
  'admin', // Legacy role - kept for backwards compatibility
] as const;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useUserRole(): UserRoleState {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch role immediately on mount
    fetchUserRole();

    // Subscribe to auth state changes to refetch role on login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Fetches the current user's role(s) from the database
   * and determines the highest priority role.
   */
  const fetchUserRole = async () => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      // No session = no role
      if (!session?.user) {
        setRole(null);
        setLoading(false);
        return;
      }

      // Fetch all roles for this user
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      // Handle errors or empty results
      if (error || !userRoles || userRoles.length === 0) {
        setRole(null);
        setLoading(false);
        return;
      }

      // Determine highest priority role
      const roleValues = userRoles.map(r => r.role as AppUserRole);
      const highestRole = determineHighestPriorityRole(roleValues);
      
      setRole(highestRole);
    } catch (error) {
      console.error("Failed to fetch user role:", error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Given an array of roles, returns the one with highest priority.
   */
  function determineHighestPriorityRole(roles: AppUserRole[]): UserRole {
    for (const priorityRole of ROLE_PRIORITY) {
      if (roles.includes(priorityRole)) {
        return priorityRole;
      }
    }
    return null;
  }

  // Compute permission flags based on current role
  const isAdmin = role === 'administrator';
  const isStaff = role === 'staff';
  const isViewer = role === 'viewer';
  const canEdit = isAdmin || isStaff;
  const canDelete = isAdmin;
  const canCreate = isAdmin || isStaff;

  return {
    role,
    loading,
    isAdmin,
    isStaff,
    isViewer,
    canEdit,
    canDelete,
    canCreate,
  };
}
