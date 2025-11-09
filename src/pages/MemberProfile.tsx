import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, MapPin, Phone, Calendar, Users, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Member {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  church_groups: string[] | null;
}

const MemberProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [member, setMember] = useState<Member | null>(null);

  useEffect(() => {
    checkAccessAndLoadMember();
  }, [id]);

  const checkAccessAndLoadMember = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

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

      // Load member
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!memberData) {
        toast({
          title: "Not Found",
          description: "Member not found",
          variant: "destructive",
        });
        navigate('/members');
        return;
      }

      setMember(memberData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const parseAddress = (address: string | null) => {
    if (!address) return { street: null, city: null, county: null, state: null, zip: null };
    
    const parts = address.split(', ');
    const street = parts.slice(0, -4).join(', ') || null;
    const city = parts[parts.length - 4] || null;
    const county = parts[parts.length - 3]?.replace(' County', '') || null;
    const state = parts[parts.length - 2] || null;
    const zip = parts[parts.length - 1] || null;
    
    return { street, city, county, state, zip };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You need to be logged in as staff or admin to view member profiles.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  if (!member) {
    return null;
  }

  const address = parseAddress(member.address);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-20">
        <Button
          variant="ghost"
          onClick={() => navigate('/members')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Members
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl">{member.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
              
              {member.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${member.email}`} className="text-foreground hover:text-primary">
                      {member.email}
                    </a>
                  </div>
                </div>
              )}
              
              {member.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a href={`tel:${member.phone}`} className="text-foreground hover:text-primary">
                      {member.phone}
                    </a>
                  </div>
                </div>
              )}
              
              {member.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <div className="text-foreground space-y-1">
                      {address.street && <p>{address.street}</p>}
                      <p>
                        {address.city && `${address.city}, `}
                        {address.county && `${address.county} County, `}
                        {address.state} {address.zip}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Personal Information */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
              
              {member.date_of_birth && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="text-foreground">{formatDate(member.date_of_birth)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Church Groups */}
            {member.church_groups && member.church_groups.length > 0 && (
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">Church Groups</p>
                    <div className="flex flex-wrap gap-2">
                      {member.church_groups.map((group, index) => (
                        <Badge key={index} variant="secondary">
                          {group}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default MemberProfile;
