import { Navigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@/lib/permissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
}

export function ProtectedRoute({ 
  children, 
  permission, 
  permissions = [],
  requireAll = false 
}: ProtectedRouteProps) {
  const { can, canAny, loading } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // Single permission check
  if (permission && !can(permission)) {
    return <Navigate to="/forbidden" replace />;
  }

  // Multiple permissions check
  if (permissions.length > 0) {
    if (requireAll) {
      // Require ALL permissions
      const hasAll = permissions.every(p => can(p));
      if (!hasAll) {
        return <Navigate to="/forbidden" replace />;
      }
    } else {
      // Require ANY permission
      if (!canAny(permissions)) {
        return <Navigate to="/forbidden" replace />;
      }
    }
  }

  return <>{children}</>;
}
