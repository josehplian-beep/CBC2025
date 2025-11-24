import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, User } from "lucide-react";
import { getRoleDisplayName, ALL_ROLES, type UserRole } from "@/lib/permissions";

interface UserWithRole {
  id: string;
  full_name: string;
  email: string;
  role: UserRole | null;
  role_id: string | null;
}

export default function AdminRoleManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, user_id");

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role");

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.user_id,
          full_name: profile.full_name || 'Unknown',
          email: profile.email || 'No email',
          role: userRole?.role as UserRole || null,
          role_id: userRole?.id || null
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, roleId: string | null, newRole: UserRole) => {
    setSaving(userId);
    try {
      if (roleId) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("id", roleId);

        if (error) throw error;
      } else {
        // Create new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      toast.success(`Role updated to ${getRoleDisplayName(newRole)}`);
      await fetchUsers();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error(`Failed to update role: ${error.message || "Unknown error"}`);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-center">Loading users...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Role Management</h1>
            <p className="text-muted-foreground">Manage user roles and permissions</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users & Roles</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={user.role || 'member'}
                        onValueChange={(value) => 
                          handleRoleChange(user.id, user.role_id, value as UserRole)
                        }
                        disabled={saving === user.id}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {getRoleDisplayName(role)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {saving === user.id && (
                        <span className="text-sm text-muted-foreground">Saving...</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Permissions Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2 font-semibold border-b pb-2">
                <div>Role</div>
                <div>Permissions</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 py-2 border-b">
                <div className="font-medium">Member</div>
                <div className="text-muted-foreground">View public content only</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 py-2 border-b">
                <div className="font-medium">Editor</div>
                <div className="text-muted-foreground">Manage albums, events, testimonies</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 py-2 border-b">
                <div className="font-medium">Teacher</div>
                <div className="text-muted-foreground">Manage students, classes, attendance</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 py-2 border-b">
                <div className="font-medium">Staff</div>
                <div className="text-muted-foreground">Manage members, departments, staff</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 py-2">
                <div className="font-medium">Administrator</div>
                <div className="text-muted-foreground">Full system access</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
