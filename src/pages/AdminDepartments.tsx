import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Upload } from "lucide-react";

interface DepartmentMember {
  id: string;
  name: string;
  role: string;
  department: string;
  profile_image_url?: string;
  display_order: number;
}

const AdminDepartments = () => {
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState("deacons");
  const [editingMember, setEditingMember] = useState<DepartmentMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const departments = [
    { value: "deacons", label: "Deacons" },
    { value: "women", label: "Women" },
    { value: "youth", label: "Youth" },
    { value: "children", label: "Children" },
    { value: "mission", label: "Mission" },
    { value: "building", label: "Building" },
    { value: "culture", label: "Culture" },
    { value: "media", label: "Media" },
    { value: "auditors", label: "Auditors" }
  ];

  useEffect(() => {
    fetchMembers();
  }, [selectedDept]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("department_members")
        .select("*")
        .eq("department", selectedDept)
        .order("display_order");

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, memberId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${memberId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("department-photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("department-photos")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("department_members")
        .update({ profile_image_url: publicUrl })
        .eq("id", memberId);

      if (updateError) throw updateError;

      toast.success("Photo uploaded successfully");
      fetchMembers();
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;

    try {
      const { error } = await supabase
        .from("department_members")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Member deleted successfully");
      fetchMembers();
    } catch (error) {
      console.error("Error deleting member:", error);
      toast.error("Failed to delete member");
    }
  };

  const handleSaveMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const memberData = {
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      department: selectedDept,
      display_order: parseInt(formData.get("display_order") as string) || 0
    };

    try {
      if (editingMember) {
        const { error } = await supabase
          .from("department_members")
          .update(memberData)
          .eq("id", editingMember.id);

        if (error) throw error;
        toast.success("Member updated successfully");
      } else {
        const { error } = await supabase
          .from("department_members")
          .insert(memberData);

        if (error) throw error;
        toast.success("Member added successfully");
      }

      setIsDialogOpen(false);
      setEditingMember(null);
      fetchMembers();
    } catch (error) {
      console.error("Error saving member:", error);
      toast.error("Failed to save member");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Manage Department Members</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMember(null)}>Add Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMember ? "Edit" : "Add"} Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveMember} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" defaultValue={editingMember?.name} required />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" name="role" defaultValue={editingMember?.role} required />
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
                <Button type="submit" className="w-full">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <Label>Select Department</Label>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map(member => (
            <Card key={member.id}>
              <CardHeader>
                <CardTitle className="text-lg">{member.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  {member.profile_image_url ? (
                    <img 
                      src={member.profile_image_url} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold">
                      {member.name.split(" ").map(n => n[0]).join("")}
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground">{member.role}</p>
                
                <div className="flex gap-2">
                  <Label htmlFor={`upload-${member.id}`} className="flex-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      disabled={uploading}
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id={`upload-${member.id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, member.id)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditingMember(member);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteMember(member.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && members.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No members found for this department</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminDepartments;
