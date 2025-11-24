import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Shield } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  roles: string[];
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Unauthorized",
          description: "You must be logged in as an admin.",
          variant: "destructive",
        });
        return;
      }

      const supabaseUrl = "https://auztoefiuddwerfbpcpm.supabase.co";
      const response = await fetch(
        `${supabaseUrl}/functions/v1/admin-users`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetUserId) return;

    setResetting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No session");
      }

      const supabaseUrl = "https://auztoefiuddwerfbpcpm.supabase.co";
      const response = await fetch(
        `${supabaseUrl}/functions/v1/admin-users?action=reset_password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: resetUserId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      toast({
        title: "Password reset sent",
        description: "A password reset email has been sent to the user.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset email.",
        variant: "destructive",
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
      day: "numeric",
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "administrator":
        return "default";
      case "staff":
        return "secondary";
      case "member":
        return "outline";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users and their access roles
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <Badge key={role} variant={getRoleBadgeVariant(role)}>
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">No roles</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setResetUserId(user.email)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
              {resetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Email"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
