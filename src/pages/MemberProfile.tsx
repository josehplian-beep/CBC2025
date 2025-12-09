import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, MapPin, Phone, Calendar, Users, Lock, Loader2, Edit } from "lucide-react";
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
  gender: string | null;
  baptized: boolean | null;
  profile_image_url: string | null;
  position: string | null;
  department: string | null;
  service_year: string | null;
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

      // Check if user has access (administrator, staff, editor, teacher, or member)
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (rolesError) throw rolesError;

      const hasAccess = roles?.some(r => 
        r.role === 'administrator' || 
        r.role === 'staff' || 
        r.role === 'editor' ||
        r.role === 'teacher' ||
        r.role === 'member'
      );
      
      if (!hasAccess) {
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

  const STATE_ABBREVIATIONS: Record<string, string> = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
    "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
    "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
    "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
    "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
    "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
  };

  const getStateAbbreviation = (state: string | null): string | null => {
    if (!state) return null;
    // If already an abbreviation (2 chars), return as-is
    if (state.length === 2) return state.toUpperCase();
    // Look up the abbreviation
    return STATE_ABBREVIATIONS[state] || state;
  };

  const parseAddress = (address: string | null) => {
    if (!address) return { street: null, street2: null, city: null, state: null, zip: null };
    
    // Format: street|||line2|||city|||state|||zip
    const parts = address.split('|||').map(p => p?.trim());
    const street = parts[0] || null;
    const street2 = parts[1] || null;
    const city = parts[2] || null;
    const state = getStateAbbreviation(parts[3] || null);
    const zip = parts[4] || null;
    
    return { street, street2, city, state, zip };
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
              You need to be logged in with member access or higher to view member profiles.
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
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/members')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Button>
          {hasAccess && (
            <Button onClick={() => navigate(`/members/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-[400px_1fr] gap-8">
          {/* Left side - Profile Image */}
          <div className="bg-muted rounded-lg overflow-hidden aspect-square flex items-center justify-center">
            {member.profile_image_url ? (
              <img
                src={member.profile_image_url}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-muted">
                <Users className="w-32 h-32 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Right side - Member Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-6">{member.name}</h1>
              
              {member.gender && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground uppercase mb-1">GENDER</p>
                  <p className="text-base text-foreground">{member.gender}</p>
                </div>
              )}
              
              {member.baptized !== null && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground uppercase mb-1">BAPTIZED</p>
                  <p className="text-base text-foreground">{member.baptized ? "Yes" : "No"}</p>
                </div>
              )}
              
              {member.phone && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-foreground uppercase mb-1">PHONE NUMBER</p>
                  <p className="text-base text-foreground">{member.phone}</p>
                </div>
              )}
            </div>

            {/* Position/Department/Year Table */}
            {(member.position || member.department || member.service_year) && (
              <div className="mt-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="py-3 px-4 text-left font-semibold">Position</th>
                      <th className="py-3 px-4 text-left font-semibold">Department</th>
                      <th className="py-3 px-4 text-left font-semibold">Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-4 px-4">{member.position || '—'}</td>
                      <td className="py-4 px-4">{member.department || '—'}</td>
                      <td className="py-4 px-4">{member.service_year || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Additional Contact Information */}
            {member.email && (
              <div className="pt-6 border-t">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase">Email</p>
                    <a href={`mailto:${member.email}`} className="text-foreground hover:text-primary">
                      {member.email}
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            {member.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase">Address</p>
                  <div className="text-foreground space-y-1">
                    {address.street && <p>{address.street}</p>}
                    {address.street2 && <p>{address.street2}</p>}
                    <p>
                      {[
                        address.city,
                        address.state,
                        address.zip
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {member.date_of_birth && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase">Date of Birth</p>
                  <p className="text-foreground">{formatDate(member.date_of_birth)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MemberProfile;
