import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, Edit, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface DepartmentMember {
  id: string;
  name: string;
  role: string;
  department: string;
  profile_image_url: string | null;
  display_order: number;
}

const AdminDepartments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<DepartmentMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const departments = [
    "deacons", "women", "youth", "children", "mission", 
    "building", "culture", "media", "auditors"
  ];

  useEffect(() => {
    checkAdminAndLoadMembers();
  }, []);

  const checkAdminAndLoadMembers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    if (!roles?.some(r => r.role === 'admin')) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    loadMembers();
  };

  const loadMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('department_members')
      .select('*')
      .order('department', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load department members.",
        variant: "destructive",
      });
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  };

  const handleImageUpload = async (file: File, memberId?: string) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${memberId || 'new'}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('department-profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('department-profiles')
        .getPublicUrl(filePath);

      setUploading(false);
      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploading(false);
      return null;
    }
  };

  const handleSaveMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const memberData = {
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      department: formData.get('department') as string,
      display_order: parseInt(formData.get('display_order') as string) || 0,
      profile_image_url: editingMember?.profile_image_url || null,
    };

    const imageFile = formData.get('image') as File;
    if (imageFile && imageFile.size > 0) {
      const imageUrl = await handleImageUpload(imageFile, editingMember?.id);
      if (imageUrl) {
        memberData.profile_image_url = imageUrl;
      }
    }

    if (editingMember) {
      const { error } = await supabase
        .from('department_members')
        .update(memberData)
        .eq('id', editingMember.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update member.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Member updated successfully.",
        });
        setIsDialogOpen(false);
        loadMembers();
      }
    } else {
      const { error } = await supabase
        .from('department_members')
        .insert(memberData);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add member.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Member added successfully.",
        });
        setIsDialogOpen(false);
        loadMembers();
      }
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;

    const { error } = await supabase
      .from('department_members')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete member.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Member deleted successfully.",
      });
      loadMembers();
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold mb-2">Manage Departments</h1>
            <p className="text-muted-foreground">Add, edit, and manage department members</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingMember(null);
                setIsDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? "Edit Member" : "Add New Member"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSaveMember} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingMember?.name}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role/Position</Label>
                  <Input
                    id="role"
                    name="role"
                    defaultValue={editingMember?.role}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select name="department" defaultValue={editingMember?.department} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept.charAt(0).toUpperCase() + dept.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    name="display_order"
                    type="number"
                    defaultValue={editingMember?.display_order || 0}
                  />
                </div>

                <div>
                  <Label htmlFor="image">Profile Picture</Label>
                  <Input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                  />
                  {editingMember?.profile_image_url && (
                    <img 
                      src={editingMember.profile_image_url} 
                      alt={editingMember.name}
                      className="mt-2 w-20 h-20 rounded-full object-cover"
                    />
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? "Uploading..." : "Save"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-6">
            {departments.map((dept) => {
              const deptMembers = members.filter(m => m.department === dept);
              if (deptMembers.length === 0) return null;

              return (
                <Card key={dept}>
                  <CardHeader>
                    <CardTitle className="capitalize">{dept}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {deptMembers.map((member) => (
                        <div 
                          key={member.id}
                          className="border rounded-lg p-4 flex items-start gap-4"
                        >
                          {member.profile_image_url ? (
                            <img 
                              src={member.profile_image_url}
                              alt={member.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                              <span className="text-xl font-bold">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <h3 className="font-semibold">{member.name}</h3>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                            
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingMember(member);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteMember(member.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminDepartments;
