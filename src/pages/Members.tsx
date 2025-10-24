import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Mail, MapPin, Phone, User, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

const Members = () => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccessAndLoadMembers();
  }, []);

  const checkAccessAndLoadMembers = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      setUser(session.user);

      // Check if user has staff or admin role
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (rolesError) throw rolesError;

      const hasStaffAccess = roles?.some(r => r.role === 'staff' || r.role === 'admin');
      
      if (!hasStaffAccess) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);

      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .order('name');

      if (membersError) throw membersError;

      setMembers(membersData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center mt-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading member directory...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 mt-20">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl">Member Directory</CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                This directory is restricted to authorized staff members only.
              </p>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You must be signed in with a staff account to access the member directory.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => navigate("/auth")} 
                className="w-full mt-4"
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 mt-20">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="font-display text-2xl">Access Denied</CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                You do not have permission to access the member directory.
              </p>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This directory is restricted to authorized staff members. Please contact church administration if you believe you should have access.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => navigate("/")} 
                variant="outline"
                className="w-full mt-4"
              >
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[200px] flex items-center justify-center overflow-hidden mt-20 bg-primary">
        <div className="relative z-10 text-center text-primary-foreground px-4">
          <User className="w-12 h-12 mx-auto mb-3" />
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">Member Directory</h1>
          <p className="text-lg text-primary-foreground/90">
            Connect with our church family
          </p>
        </div>
      </section>

      {/* Members Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-display text-2xl font-bold">
              {members.length} {members.length === 1 ? 'Member' : 'Members'}
            </h2>
          </div>

          {members.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-display text-xl font-semibold mb-2">No Members Yet</h3>
                <p className="text-muted-foreground">
                  The member directory is currently empty. Contact administration to add members.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <Card key={member.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">{member.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {member.address && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{member.address}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <a href={`tel:${member.phone}`} className="hover:text-primary">
                          {member.phone}
                        </a>
                      </div>
                    )}
                    {member.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <a href={`mailto:${member.email}`} className="hover:text-primary truncate">
                          {member.email}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Members;
