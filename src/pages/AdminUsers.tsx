import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Shield, UserPlus, Users, Search, Filter, X, Eye, Lock, Edit, FileCheck, GraduationCap, User, Info, Trash2, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MemberLinkingDialog } from "@/components/MemberLinkingDialog";
interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  roles: string[];
}
const rolePermissions = {
  administrator: {
    icon: Shield,
    color: "bg-red-500",
    description: "Full system access",
    permissions: ["✓ Manage all users and roles", "✓ Access all admin pages", "✓ Manage staff biographies", "✓ Manage events and departments", "✓ View and edit all member data", "✓ Manage prayer requests", "✓ Full database access"],
    restrictions: []
  },
  staff: {
    icon: Users,
    color: "bg-blue-500",
    description: "Staff-level permissions",
    permissions: ["✓ View all members", "✓ View families", "✓ Manage attendance", "✓ View students and classes", "✓ View prayer requests"],
    restrictions: ["✗ Cannot manage users", "✗ Cannot edit system settings"]
  },
  editor: {
    icon: Edit,
    color: "bg-purple-500",
    description: "Content management",
    permissions: ["✓ Manage staff biographies", "✓ Manage albums and photos", "✓ View all members", "✓ Manage department members"],
    restrictions: ["✗ Cannot manage users", "✗ Limited admin access"]
  },
  teacher: {
    icon: GraduationCap,
    color: "bg-green-500",
    description: "Educational access",
    permissions: ["✓ Manage classes", "✓ Manage students", "✓ Take attendance", "✓ View class reports"],
    restrictions: ["✗ Cannot access other admin areas", "✗ Limited to education features"]
  },
  member: {
    icon: User,
    color: "bg-orange-500",
    description: "Basic member access",
    permissions: ["✓ View own profile", "✓ View other members", "✓ Submit prayer requests", "✓ View events"],
    restrictions: ["✗ No admin access", "✗ Cannot edit others' data"]
  },
  viewer: {
    icon: Eye,
    color: "bg-gray-500",
    description: "Read-only access",
    permissions: ["✓ View members", "✓ View events", "✓ View albums", "✓ View testimonials"],
    restrictions: ["✗ No editing capabilities", "✗ No admin access"]
  }
};
const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<'administrator' | 'staff' | 'editor' | 'teacher' | 'member' | 'viewer'>("member");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedRoleInfo, setSelectedRoleInfo] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null);
  const [linkingUserEmail, setLinkingUserEmail] = useState<string>("");
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchUsers();
  }, []);
  useEffect(() => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user => user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.roles.includes(roleFilter));
    }
    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter]);
  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
  };
  const activeFiltersCount = [searchQuery, roleFilter !== 'all'].filter(Boolean).length;
  const fetchUsers = async () => {
    try {
      // Refresh session to get a valid token
      const {
        data: {
          session
        },
        error: sessionError
      } = await supabase.auth.refreshSession();
      if (sessionError || !session) {
        toast({
          title: "Unauthorized",
          description: "You must be logged in as an admin.",
          variant: "destructive"
        });
        return;
      }
      const supabaseUrl = "https://auztoefiuddwerfbpcpm.supabase.co";
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-users`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users);
      setFilteredUsers(data.users);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      // Refresh session to get a valid token
      const {
        data: {
          session
        },
        error: sessionError
      } = await supabase.auth.refreshSession();
      if (sessionError || !session) {
        throw new Error("No session");
      }
      const supabaseUrl = "https://auztoefiuddwerfbpcpm.supabase.co";
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-users?action=update_role`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          role: newRole
        })
      });
      if (!response.ok) {
        throw new Error("Failed to update role");
      }
      toast({
        title: "Role updated",
        description: "User role has been updated successfully."
      });

      // Refresh the users list
      await fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive"
      });
    } finally {
      setUpdatingRole(null);
    }
  };
  const handleResetPassword = async () => {
    if (!resetUserId) return;
    setResetting(true);
    try {
      // Refresh session to get a valid token
      const {
        data: {
          session
        },
        error: sessionError
      } = await supabase.auth.refreshSession();
      if (sessionError || !session) {
        throw new Error("No session");
      }
      const supabaseUrl = "https://auztoefiuddwerfbpcpm.supabase.co";
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-users?action=reset_password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: resetUserId
        })
      });
      if (!response.ok) {
        throw new Error("Failed to reset password");
      }
      toast({
        title: "Password reset sent",
        description: "A password reset email has been sent to the user."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset email.",
        variant: "destructive"
      });
    } finally {
      setResetting(false);
      setResetUserId(null);
    }
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: "Error",
        description: "Email and password are required.",
        variant: "destructive"
      });
      return;
    }
    setCreating(true);
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Call edge function to create user server-side
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'create_user',
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "User created",
        description: `User created successfully with ${newUserRole} role.`
      });
      setIsCreateDialogOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("member");
      await fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    setDeleting(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !session) {
        throw new Error("No session");
      }

      const supabaseUrl = "https://auztoefiuddwerfbpcpm.supabase.co";
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-users?action=delete_user`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: deleteUserId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      toast({
        title: "User deleted",
        description: "User has been deleted successfully.",
      });

      await fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteUserId(null);
    }
  };
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "administrator":
        return "default";
      case "staff":
        return "secondary";
      case "editor":
        return "secondary";
      case "teacher":
        return "secondary";
      case "member":
        return "outline";
      case "viewer":
        return "outline";
      default:
        return "outline";
    }
  };
  const getRoleStats = () => {
    const stats = {
      total: users.length,
      administrator: users.filter(u => u.roles.includes('administrator')).length,
      staff: users.filter(u => u.roles.includes('staff')).length,
      editor: users.filter(u => u.roles.includes('editor')).length,
      teacher: users.filter(u => u.roles.includes('teacher')).length,
      member: users.filter(u => u.roles.includes('member')).length,
      viewer: users.filter(u => u.roles.includes('viewer')).length,
      filtered: filteredUsers.length
    };
    return stats;
  };
  const stats = getRoleStats();
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  return <>
      <section className="relative pt-16 pb-24 bg-gradient-to-br from-primary via-primary/95 to-primary/80 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground mb-3 flex items-center gap-3">
                <Shield className="w-12 h-12" />
                User Management
              </h1>
              <p className="text-primary-foreground/80 text-lg">
                Manage users, roles, and permissions
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="lg" className="bg-background text-foreground hover:bg-background/90 shadow-xl">
              <UserPlus className="w-5 h-5 mr-2" />
              Create User
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <Card className="bg-background/95 backdrop-blur border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Total Users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card className="bg-background/95 backdrop-blur border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.administrator}</div>
              </CardContent>
            </Card>

            <Card className="bg-background/95 backdrop-blur border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs flex items-center gap-1">
                  <Users className="w-3 h-3" /> Staff
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.staff}</div>
              </CardContent>
            </Card>

            <Card className="bg-background/95 backdrop-blur border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs flex items-center gap-1">
                  <Edit className="w-3 h-3" /> Editor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.editor}</div>
              </CardContent>
            </Card>

            <Card className="bg-background/95 backdrop-blur border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> Teacher
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.teacher}</div>
              </CardContent>
            </Card>

            <Card className="bg-background/95 backdrop-blur border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs flex items-center gap-1">
                  <User className="w-3 h-3" /> Member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.member}</div>
              </CardContent>
            </Card>

            <Card className="bg-background/95 backdrop-blur border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Viewer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{stats.viewer}</div>
              </CardContent>
            </Card>

            <Card className="bg-background/95 backdrop-blur border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Showing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.filtered}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Filters */}
          <Card className="mb-8 shadow-lg">
            
            
          </Card>

          {/* Role Permissions Guide */}
          <Card className="mb-8 shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Role Permissions Guide
              </CardTitle>
              <CardDescription>
                Click on a role to view detailed permissions and restrictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(rolePermissions).map(([role, info]) => {
                const Icon = info.icon;
                return <Button key={role} variant={selectedRoleInfo === role ? "default" : "outline"} className="h-auto flex-col gap-2 p-4" onClick={() => setSelectedRoleInfo(selectedRoleInfo === role ? null : role)}>
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-medium capitalize">{role}</span>
                    </Button>;
              })}
              </div>

              {selectedRoleInfo && <Card className="mt-4 bg-muted/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg capitalize">
                      {(() => {
                    const Icon = rolePermissions[selectedRoleInfo as keyof typeof rolePermissions].icon;
                    return <Icon className="w-5 h-5" />;
                  })()}
                      {selectedRoleInfo}
                    </CardTitle>
                    <CardDescription>
                      {rolePermissions[selectedRoleInfo as keyof typeof rolePermissions].description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-green-600">Permissions</h4>
                      <ul className="space-y-1 text-sm">
                        {rolePermissions[selectedRoleInfo as keyof typeof rolePermissions].permissions.map((perm, idx) => <li key={idx} className="text-muted-foreground">{perm}</li>)}
                      </ul>
                    </div>
                    {rolePermissions[selectedRoleInfo as keyof typeof rolePermissions].restrictions.length > 0 && <div>
                        <h4 className="font-semibold text-sm mb-2 text-red-600">Restrictions</h4>
                        <ul className="space-y-1 text-sm">
                          {rolePermissions[selectedRoleInfo as keyof typeof rolePermissions].restrictions.map((rest, idx) => <li key={idx} className="text-muted-foreground">{rest}</li>)}
                        </ul>
                      </div>}
                  </CardContent>
                </Card>}
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Showing {filteredUsers.length} of {users.length} users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Sign In</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No users found matching your filters</p>
                        </TableCell>
                      </TableRow> : filteredUsers.map(user => <TableRow key={user.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.roles.includes('administrator') ? 'bg-red-500' : user.roles.includes('staff') ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select value={user.roles[0] || ""} onValueChange={value => handleRoleChange(user.id, value)} disabled={updatingRole === user.id}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="administrator">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-red-500" />
                                    Administrator
                                  </div>
                                </SelectItem>
                                <SelectItem value="staff">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    Staff
                                  </div>
                                </SelectItem>
                                <SelectItem value="editor">
                                  <div className="flex items-center gap-2">
                                    <Edit className="w-4 h-4 text-purple-500" />
                                    Editor
                                  </div>
                                </SelectItem>
                                <SelectItem value="teacher">
                                  <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-green-500" />
                                    Teacher
                                  </div>
                                </SelectItem>
                                <SelectItem value="member">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-orange-500" />
                                    Member
                                  </div>
                                </SelectItem>
                                <SelectItem value="viewer">
                                  <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-gray-500" />
                                    Viewer
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(user.last_sign_in_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setLinkingUserId(user.id);
                                  setLinkingUserEmail(user.email);
                                }} 
                                className="hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                              >
                                <Link2 className="h-4 w-4 mr-2" />
                                Link Profile
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setResetUserId(user.email)} className="hover:bg-primary/10">
                                <Mail className="h-4 w-4 mr-2" />
                                Reset Password
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteUserId(user.id)} className="hover:bg-destructive/10 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>)}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account with a specific role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="user@example.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUserRole} onValueChange={value => setNewUserRole(value as typeof newUserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrator">Administrator</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </> : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!resetUserId} onOpenChange={() => setResetUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset User Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a password reset email to <strong>{resetUserId}</strong>.
              The user will receive an email with a link to reset their password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword} disabled={resetting}>
              {resetting ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </> : "Send Reset Email"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone and will permanently remove the user and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Member Linking Dialog */}
      <MemberLinkingDialog
        isOpen={!!linkingUserId}
        onClose={() => {
          setLinkingUserId(null);
          setLinkingUserEmail("");
        }}
        userId={linkingUserId || ""}
        userEmail={linkingUserEmail}
        onLinkComplete={() => fetchUsers()}
      />
    </>;
};
export default AdminUsers;