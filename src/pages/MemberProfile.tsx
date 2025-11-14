import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, MapPin, Phone, Calendar, Users, Lock, Loader2, Edit, Building2, UserCircle2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { MessageDialog } from "@/components/MessageDialog";

interface Member {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  profile_image_url: string | null;
  position: string | null;
  department: string | null;
  service_year: string | null;
}

interface RelatedMember {
  id: string;
  name: string;
  position: string | null;
  department: string | null;
  profile_image_url: string | null;
}

const MemberProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [relatedMembers, setRelatedMembers] = useState<RelatedMember[]>([]);
  const [departmentMembers, setDepartmentMembers] = useState<RelatedMember[]>([]);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAccessAndLoadMember();
  }, [id]);

  const checkAccessAndLoadMember = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Check if user has staff, admin, or member role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const hasRequiredRole = roles?.some(r => r.role === 'staff' || r.role === 'admin' || r.role === 'member');
      
      if (!hasRequiredRole) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);
      setCurrentUserId(session.user.id);

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

      // Load related members from the same department
      if (memberData.department) {
        const { data: deptMembers } = await supabase
          .from('members')
          .select('id, name, position, department, profile_image_url')
          .eq('department', memberData.department)
          .neq('id', id)
          .limit(6);
        
        if (deptMembers) setDepartmentMembers(deptMembers);
      }

      // Load related members with similar positions or from address
      const address = memberData.address;
      if (address) {
        const addressParts = address.split('|||');
        const city = addressParts[2];
        
        const { data: cityMembers } = await supabase
          .from('members')
          .select('id, name, position, department, profile_image_url')
          .neq('id', id)
          .limit(6);
        
        if (cityMembers) {
          const filtered = cityMembers.filter(m => 
            m.department === memberData.department || 
            (m.position && memberData.position && m.position === memberData.position)
          );
          setRelatedMembers(filtered.slice(0, 6));
        }
      }
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
    if (!address) return { street: null, street2: null, city: null, county: null, state: null, zip: null };
    
    const parts = address.split('|||');
    const street = parts[0] || null;
    const street2 = parts[1] || null;
    const city = parts[2] || null;
    const county = parts[3]?.replace(' County', '') || null;
    const state = parts[4] || null;
    const zip = parts[5] || null;
    
    return { street, street2, city, county, state, zip };
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
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink to="/members">Members Directory</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{member.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/members')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Button>
          <div className="flex gap-2">
            {/* Message Button - show to all members except when viewing own profile */}
            {hasAccess && member.user_id && currentUserId !== member.user_id && (
              <Button variant="outline" onClick={() => setMessageDialogOpen(true)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            )}
            {hasAccess && (
              <Button onClick={() => navigate(`/members/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
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
                      {address.city && `${address.city}, `}
                      {address.county && `${address.county} County, `}
                      {address.state} {address.zip}
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

        {/* Department Link Section */}
        {member.department && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/departments')}
              >
                <Building2 className="mr-2 h-4 w-4" />
                {member.department} Department
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                View all members and information about the {member.department} department
              </p>
            </CardContent>
          </Card>
        )}

        {/* Department Members Section */}
        {departmentMembers.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Other Members in {member.department}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {departmentMembers.map((relMember) => (
                  <div
                    key={relMember.id}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/members/${relMember.id}`)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2 group-hover:ring-2 group-hover:ring-primary transition-all">
                      {relMember.profile_image_url ? (
                        <img
                          src={relMember.profile_image_url}
                          alt={relMember.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UserCircle2 className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-center line-clamp-2 group-hover:text-primary transition-colors">
                      {relMember.name}
                    </p>
                    {relMember.position && (
                      <p className="text-xs text-muted-foreground text-center line-clamp-1">
                        {relMember.position}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {departmentMembers.length >= 6 && (
                <Button
                  variant="link"
                  className="w-full mt-4"
                  onClick={() => navigate('/departments')}
                >
                  View all {member.department} members →
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Related Members Section */}
        {relatedMembers.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Related Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {relatedMembers.map((relMember) => (
                  <div
                    key={relMember.id}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/members/${relMember.id}`)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2 group-hover:ring-2 group-hover:ring-primary transition-all">
                      {relMember.profile_image_url ? (
                        <img
                          src={relMember.profile_image_url}
                          alt={relMember.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UserCircle2 className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-center line-clamp-2 group-hover:text-primary transition-colors">
                      {relMember.name}
                    </p>
                    {relMember.position && (
                      <p className="text-xs text-muted-foreground text-center line-clamp-1">
                        {relMember.position}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="link"
                className="w-full mt-4"
                onClick={() => navigate('/members')}
              >
                View all members →
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />

      {/* Message Dialog */}
      {member && (
        <MessageDialog
          open={messageDialogOpen}
          onOpenChange={setMessageDialogOpen}
          recipientId={member.id}
          recipientName={member.name}
        />
      )}
    </div>
  );
};

export default MemberProfile;
