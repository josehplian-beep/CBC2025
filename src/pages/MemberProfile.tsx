import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, Mail, MapPin, Phone, Calendar, Users, Lock, Loader2, Edit, 
  FileText, Upload, Trash2, Download, File, Briefcase, Building2, Clock,
  Heart, UserCircle, ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePermissions } from "@/hooks/usePermissions";
import { MemberTagsSection } from "@/components/members/MemberTagsSection";
import { MemberCustomFieldsSection } from "@/components/members/MemberCustomFieldsSection";
import { MemberNotesSection } from "@/components/members/MemberNotesSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  family_id: string | null;
}

interface FamilyMember {
  id: string;
  name: string;
  profile_image_url: string | null;
  position: string | null;
}

interface MemberFile {
  id: string;
  member_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  created_at: string;
}

const MemberProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [files, setFiles] = useState<MemberFile[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState("");
  const { can } = usePermissions();

  useEffect(() => {
    checkAccessAndLoadMember();
  }, [id]);

  const checkAccessAndLoadMember = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

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
      
      if (memberData.family_id) {
        const { data: familyData } = await supabase
          .from('members')
          .select('id, name, profile_image_url, position')
          .eq('family_id', memberData.family_id)
          .neq('id', memberData.id)
          .order('name');
        
        setFamilyMembers(familyData || []);
      }
      
      await loadFiles();
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

  const loadFiles = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('member_files')
        .select('*')
        .eq('member_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !id) return;

    setUploadingFile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const fileName = `${id}/${Date.now()}-${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from('member-files')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('member_files')
        .insert({
          member_id: id,
          file_name: selectedFile.name,
          file_url: fileName,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          description: fileDescription || null,
          uploaded_by: session.user.id,
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setFileDescription("");
      await loadFiles();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (file: MemberFile) => {
    if (!confirm(`Are you sure you want to delete "${file.file_name}"?`)) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('member-files')
        .remove([file.file_url]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      const { error: dbError } = await supabase
        .from('member_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "File deleted successfully",
      });

      await loadFiles();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = async (file: MemberFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('member-files')
        .download(file.file_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    if (state.length === 2) return state.toUpperCase();
    return STATE_ABBREVIATIONS[state] || state;
  };

  const parseAddress = (address: string | null) => {
    if (!address) return { street: null, street2: null, city: null, state: null, zip: null };
    
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
  const hasAddress = address.street || address.city || address.state || address.zip;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section with Gradient Background */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background pt-20 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
        
        <div className="container mx-auto px-4 relative">
          {/* Navigation Bar */}
          <div className="flex justify-between items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/members')}
              className="hover:bg-background/50 backdrop-blur-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Members
            </Button>
            {hasAccess && (
              <Button 
                onClick={() => navigate(`/members/${id}/edit`)}
                className="shadow-lg hover:shadow-xl transition-shadow"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Overlapping the Hero */}
      <div className="container mx-auto px-4 -mt-24 relative z-10 pb-12">
        <div className="grid lg:grid-cols-[320px_1fr] gap-8">
          
          {/* Left Column - Profile Card */}
          <div className="space-y-6">
            {/* Profile Image Card */}
            <Card className="overflow-hidden shadow-xl border-0 bg-card/80 backdrop-blur-sm">
              <div className="aspect-square relative">
                {member.profile_image_url ? (
                  <img
                    src={member.profile_image_url}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-muted to-muted/50">
                    <UserCircle className="w-32 h-32 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <CardContent className="p-6 text-center">
                <h1 className="text-2xl font-bold mb-2">{member.name}</h1>
                {member.position && (
                  <p className="text-muted-foreground">{member.position}</p>
                )}
                <div className="mt-4">
                  <MemberTagsSection memberId={id!} canEdit={can('manage_members')} />
                </div>
              </CardContent>
            </Card>

            {/* Quick Info Card */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                {member.department && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Department</p>
                      <p className="font-medium">{member.department}</p>
                    </div>
                  </div>
                )}
                
                {member.service_year && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Service Year</p>
                      <p className="font-medium">{member.service_year}</p>
                    </div>
                  </div>
                )}

                {member.gender && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Gender</p>
                      <p className="font-medium">{member.gender}</p>
                    </div>
                  </div>
                )}

                {member.baptized !== null && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Baptized</p>
                      <Badge variant={member.baptized ? "default" : "secondary"} className="mt-1">
                        {member.baptized ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Contact Information Card */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  {member.phone && (
                    <div className="group">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Phone</p>
                      <a 
                        href={`tel:${member.phone}`} 
                        className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        {member.phone}
                      </a>
                    </div>
                  )}

                  {member.email && (
                    <div className="group">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Email</p>
                      <a 
                        href={`mailto:${member.email}`} 
                        className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2 break-all"
                      >
                        <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                        {member.email}
                      </a>
                    </div>
                  )}

                  {member.date_of_birth && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date of Birth</p>
                      <p className="font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(member.date_of_birth)}
                      </p>
                    </div>
                  )}
                </div>

                {hasAddress && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Address</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-foreground">
                        {address.street && <p>{address.street}</p>}
                        {address.street2 && <p>{address.street2}</p>}
                        <p>
                          {[address.city, address.state, address.zip].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!member.phone && !member.email && !hasAddress && !member.date_of_birth && (
                  <p className="text-muted-foreground text-center py-4">No contact information available</p>
                )}
              </CardContent>
            </Card>

            {/* Family Members Card */}
            {familyMembers.length > 0 && (
              <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    Family Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {familyMembers.map((familyMember) => (
                      <button
                        key={familyMember.id}
                        onClick={() => navigate(`/members/${familyMember.id}`)}
                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 text-left group border border-transparent hover:border-primary/20"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-background">
                          {familyMember.profile_image_url ? (
                            <img
                              src={familyMember.profile_image_url}
                              alt={familyMember.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserCircle className="w-6 h-6 text-primary/60" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate group-hover:text-primary transition-colors">
                            {familyMember.name}
                          </p>
                          {familyMember.position && (
                            <p className="text-sm text-muted-foreground truncate">{familyMember.position}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabbed Content */}
            <Tabs defaultValue="files" className="w-full">
              <TabsList className="w-full justify-start bg-muted/30 p-1 h-auto flex-wrap">
                <TabsTrigger value="files" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Files
                </TabsTrigger>
                <TabsTrigger value="custom" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Custom Fields
                </TabsTrigger>
                {hasAccess && (
                  <TabsTrigger value="notes" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Notes
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="files" className="mt-6">
                <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      Files & Documents
                    </CardTitle>
                    {can('manage_members') && (
                      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="shadow-md">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload File</DialogTitle>
                            <DialogDescription>
                              Upload a file to this member's profile for record-keeping.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="file">Select File</Label>
                              <Input
                                id="file"
                                type="file"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="description">Description (Optional)</Label>
                              <Input
                                id="description"
                                value={fileDescription}
                                onChange={(e) => setFileDescription(e.target.value)}
                                placeholder="Enter file description..."
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleFileUpload} 
                              disabled={!selectedFile || uploadingFile}
                            >
                              {uploadingFile ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                'Upload'
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardHeader>
                  <CardContent>
                    {files.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <File className="h-8 w-8 opacity-50" />
                        </div>
                        <p className="font-medium">No files uploaded yet</p>
                        <p className="text-sm mt-1">Upload documents to keep records organized</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {files.map((file) => (
                          <div 
                            key={file.id} 
                            className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{file.file_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {file.description || formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadFile(file)}
                                title="Download"
                                className="h-8 w-8"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {can('manage_members') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteFile(file)}
                                  title="Delete"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="custom" className="mt-6">
                <MemberCustomFieldsSection memberId={id!} canEdit={can('manage_members')} />
              </TabsContent>

              {hasAccess && (
                <TabsContent value="notes" className="mt-6">
                  <MemberNotesSection memberId={id!} canEdit={can('manage_members')} />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default MemberProfile;
