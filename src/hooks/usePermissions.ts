import { useMemo } from 'react';
import { useUserRole } from './useUserRole';
import { hasPermission, hasAnyPermission, type Permission, type UserRole } from '@/lib/permissions';

export function usePermissions() {
  const { role, loading } = useUserRole();

  const can = useMemo(
    () => (permission: Permission) => hasPermission(role as UserRole, permission),
    [role]
  );

  const canAny = useMemo(
    () => (permissions: Permission[]) => hasAnyPermission(role as UserRole, permissions),
    [role]
  );

  const userRole = role as UserRole;
  
  return {
    role: userRole,
    loading,
    can,
    canAny,
    isAdministrator: userRole === 'administrator',
    isStaff: userRole === 'staff',
    isTeacher: userRole === 'teacher',
    isEditor: userRole === 'editor',
    isMember: userRole === 'member'
  };
}
