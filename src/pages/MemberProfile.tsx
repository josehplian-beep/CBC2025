import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, MapPin, Phone, Calendar, Users, Lock, Loader2, Edit, FileText, Upload, Trash2, Download, File } from "lucide-react";
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
      
      // Load family members if this member has a family_id
      if (memberData.family_id) {
        const { data: familyData } = await supabase
          .from('members')
          .select('id, name, profile_image_url, position')
          .eq('family_id', memberData.family_id)
          .neq('id', memberData.id)
          .order('name');
        
        setFamilyMembers(familyData || []);
      }
      
      // Load files
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

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${id}/${Date.now()}-${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from('member-files')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('member-files')
        .getPublicUrl(fileName);

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
              <h1 className="text-4xl font-bold mb-4">{member.name}</h1>
              
              {/* Tags Section */}
              <div className="mb-6">
                <MemberTagsSection memberId={id!} canEdit={can('manage_members')} />
              </div>
              
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
            
            {hasAddress && (
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

            {/* Family Members Section */}
            {familyMembers.length > 0 && (
              <div className="pt-6 border-t">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-muted-foreground uppercase mb-3">Family Members</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {familyMembers.map((familyMember) => (
                        <button
                          key={familyMember.id}
                          onClick={() => navigate(`/members/${familyMember.id}`)}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {familyMember.profile_image_url ? (
                              <img
                                src={familyMember.profile_image_url}
                                alt={familyMember.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{familyMember.name}</p>
                            {familyMember.position && (
                              <p className="text-xs text-muted-foreground truncate">{familyMember.position}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Files Section */}
        <div className="mt-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Files & Documents
              </CardTitle>
              {can('manage_members') && (
                <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
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
                <div className="text-center py-8 text-muted-foreground">
                  <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No files uploaded yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {file.file_name}
                          </div>
                        </TableCell>
                        <TableCell>{file.description || '—'}</TableCell>
                        <TableCell>{formatFileSize(file.file_size)}</TableCell>
                        <TableCell>
                          {new Date(file.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadFile(file)}
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {can('manage_members') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteFile(file)}
                                title="Delete"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Custom Fields Section */}
          <MemberCustomFieldsSection memberId={id!} canEdit={can('manage_members')} />

          {/* Private Notes Section */}
          {hasAccess && (
            <MemberNotesSection memberId={id!} canEdit={can('manage_members')} />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MemberProfile;
