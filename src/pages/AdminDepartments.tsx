import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { toast } from "sonner";
import { Pencil, Trash2, Upload } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface DepartmentMember {
  id: string;
  name: string;
  role: string;
  department: string;
  profile_image_url?: string;
  display_order: number;
  year_range: string;
}

const AdminDepartments = () => {
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState("deacons");
  const [editingMember, setEditingMember] = useState<DepartmentMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");
  const [currentMemberId, setCurrentMemberId] = useState<string>("");
  const [deduping, setDeduping] = useState(false);
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [newDeptDialogOpen, setNewDeptDialogOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  
  // Calculate current year range based on current date
  const getCurrentYearRange = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    return `${currentYear}-${currentYear + 1}`;
  };
  
  const [selectedYearRange, setSelectedYearRange] = useState(getCurrentYearRange());
  
  // Available year ranges
  const yearRanges = [
    "2024-2025",
    "2022-2023", 
    "2020-2021",
    "2018-2019"
  ];

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      fetchMembers();
    }
  }, [selectedDept, selectedYearRange]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("department_members")
        .select("department");

      if (error) throw error;

      const uniqueDepts = Array.from(new Set(data?.map(m => m.department) || []));
      const orderedDepts = [
        "deacons", "women", "youth", "children", "praise-worship",
        "mission", "building", "culture", "media", "auditors"
      ];

      const deptObjects = orderedDepts
        .filter(d => uniqueDepts.includes(d))
        .map(d => ({
          value: d,
          label: d.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        }));

      const additionalDepts = uniqueDepts
        .filter(d => !orderedDepts.includes(d))
        .sort()
        .map(d => ({
          value: d,
          label: d.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        }));

      setDepartments([...deptObjects, ...additionalDepts]);
      
      if (deptObjects.length > 0 && !selectedDept) {
        setSelectedDept(deptObjects[0].value);
      }
    } catch (error) {
      // Silently handle fetch error
    }
  };

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) {
      toast.error("Department name is required");
      return;
    }

    const deptValue = newDeptName.toLowerCase().replace(/\s+/g, '-');
    
    if (departments.some(d => d.value === deptValue)) {
      toast.error("Department already exists");
      return;
    }

    setDepartments([...departments, {
      value: deptValue,
      label: newDeptName.trim()
    }]);
    
    setSelectedDept(deptValue);
    setNewDeptName("");
    setNewDeptDialogOpen(false);
    toast.success("Department added! Now you can add members to it.");
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("department_members")
        .select("*")
        .eq("department", selectedDept)
        .eq("year_range", selectedYearRange)
        .order("display_order");

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, memberId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCurrentMemberId(memberId);
      setCropDialogOpen(true);
    };
    
    reader.readAsDataURL(file);
  };

  const handleCroppedImage = async (croppedImage: Blob) => {
    setUploading(true);

    try {
      const fileName = `${currentMemberId}-${Date.now()}.jpg`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("department-photos")
        .upload(filePath, croppedImage, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("department-photos")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("department_members")
        .update({ profile_image_url: publicUrl })
        .eq("id", currentMemberId);

      if (updateError) throw updateError;

      toast.success("Photo uploaded successfully");
      fetchMembers();
    } catch (error) {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (member: DepartmentMember) => {
    if (!confirm(`Delete photo for ${member.name}?`)) return;

    try {
      // Delete from storage if exists
      if (member.profile_image_url) {
        const fileName = member.profile_image_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from("department-photos")
            .remove([fileName]);
        }
      }

      // Remove URL from database
      const { error } = await supabase
        .from("department_members")
        .update({ profile_image_url: null })
        .eq("id", member.id);

      if (error) throw error;
      toast.success("Photo deleted successfully");
      fetchMembers();
    } catch (error) {
      toast.error("Failed to delete photo");
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
      toast.error("Failed to delete member");
    }
  };
  
  const removeDuplicates = async () => {
    if (!confirm("Remove duplicate names (per department), keeping the best entry?")) return;
    setDeduping(true);
    try {
      const { data, error } = await supabase
        .from("department_members")
        .select("id, name, department, created_at, display_order")
        .order("created_at", { ascending: true });

      if (error) throw error;

      type Row = { id: string; name: string; department: string; created_at: string | null; display_order: number | null };
      const map = new Map<string, { id: string; order: number; created: string }>();
      const toDelete: string[] = [];

      (data as Row[] | null)?.forEach((row) => {
        const key = `${row.name}__${row.department}`;
        const created = row.created_at || "1970-01-01T00:00:00Z";
        const order = row.display_order ?? 0;
        const current = map.get(key);
        if (!current) {
          map.set(key, { id: row.id, order, created });
        } else {
          const isBetter = order < current.order || (order === current.order && created < current.created);
          if (isBetter) {
            toDelete.push(current.id);
            map.set(key, { id: row.id, order, created });
          } else {
            toDelete.push(row.id);
          }
        }
      });

      if (toDelete.length === 0) {
        toast.info("No duplicates found");
        return;
      }

      // Delete in chunks to avoid payload limits
      const chunkSize = 100;
      for (let i = 0; i < toDelete.length; i += chunkSize) {
        const chunk = toDelete.slice(i, i + chunkSize);
        const { error: delError } = await supabase
          .from("department_members")
          .delete()
          .in("id", chunk);
        if (delError) throw delError;
      }

      toast.success(`Removed ${toDelete.length} duplicate entr${toDelete.length === 1 ? "y" : "ies"}`);
      fetchMembers();
    } catch (err) {
      toast.error("Failed to remove duplicates");
    } finally {
      setDeduping(false);
    }
  };

  const handleSaveMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const memberData = {
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      department: selectedDept,
      display_order: parseInt(formData.get("display_order") as string) || 0,
      year_range: formData.get("year_range") as string
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
      toast.error("Failed to save member");
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Manage Department Members</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={removeDuplicates} disabled={deduping}>
              {deduping ? "Removing duplicates..." : "Remove Duplicates"}
            </Button>
            <Dialog open={newDeptDialogOpen} onOpenChange={setNewDeptDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Add Department</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Department</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-dept-name">Department Name</Label>
                    <Input 
                      id="new-dept-name" 
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      placeholder="e.g., Sunday School"
                    />
                  </div>
                  <Button onClick={handleAddDepartment} className="w-full">
                    Add Department
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                  <Label htmlFor="year_range">Year Range</Label>
                  <Select name="year_range" defaultValue={editingMember?.year_range || selectedYearRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearRanges.map(range => (
                        <SelectItem key={range} value={range}>{range}</SelectItem>
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
                <Button type="submit" className="w-full">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6 space-y-6">
          <div>
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

          <div>
            <Label className="mb-3 block">Year Range Filter</Label>
            <ToggleGroup 
              type="single" 
              value={selectedYearRange} 
              onValueChange={(value) => value && setSelectedYearRange(value)}
              className="justify-start flex-wrap gap-2"
            >
              {yearRanges.map(range => (
                <ToggleGroupItem 
                  key={range} 
                  value={range}
                  className="px-4 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {range}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {members.map(member => (
            <Card key={member.id} className="overflow-hidden">
              <CardContent className="p-3 space-y-2">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden relative group">
                  {member.profile_image_url ? (
                    <img 
                      src={member.profile_image_url} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold">
                      {member.name.split(" ").map(n => n[0]).join("")}
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm truncate" title={member.name}>
                    {member.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate" title={member.role}>
                    {member.role}
                  </p>
                </div>
                
                <div className="flex gap-1">
                  <Label htmlFor={`upload-${member.id}`} className="flex-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="w-full text-xs"
                      disabled={uploading}
                      asChild
                    >
                      <span>
                        <Upload className="w-3 h-3 mr-1" />
                        Photo
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id={`upload-${member.id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageSelect(e, member.id)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2"
                    onClick={() => {
                      setEditingMember(member);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  {member.profile_image_url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2"
                      onClick={() => handleDeletePhoto(member)}
                      title="Delete photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2"
                      onClick={() => handleDeleteMember(member.id)}
                      title="Delete member"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
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

      <ImageCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={imageToCrop}
        onCropComplete={handleCroppedImage}
      />
    </AdminLayout>
  );
};

export default AdminDepartments;
