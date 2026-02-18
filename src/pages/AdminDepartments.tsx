import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { toast } from "sonner";
import { Pencil, Trash2, Upload, Plus, Search, Calendar, Users, X, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  const navigate = useNavigate();
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
  const [departments, setDepartments] = useState<{
    value: string;
    label: string;
  }[]>([]);
  const [newDeptDialogOpen, setNewDeptDialogOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [yearRangeDialogOpen, setYearRangeDialogOpen] = useState(false);
  const [newYearRange, setNewYearRange] = useState("");
  const [yearRanges, setYearRanges] = useState<string[]>([]);
  const [churchMembers, setChurchMembers] = useState<{ id: string; name: string }[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  // Calculate current year range based on current date
  const getCurrentYearRange = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    return `${currentYear}-${currentYear + 1}`;
  };
  const [selectedYearRange, setSelectedYearRange] = useState(getCurrentYearRange());
  useEffect(() => {
    fetchDepartments();
    fetchYearRanges();
    fetchChurchMembers();
  }, []);
  useEffect(() => {
    if (selectedDept) {
      fetchMembers();
    }
  }, [selectedDept, selectedYearRange]);

  const fetchYearRanges = async () => {
    try {
      const { data, error } = await supabase
        .from("department_members")
        .select("year_range");
      
      if (error) throw error;
      
      const currentRange = getCurrentYearRange();
      const rangesFromDb = data?.map(m => m.year_range).filter(Boolean) || [];
      const uniqueRanges = Array.from(new Set([currentRange, ...rangesFromDb])) as string[];
      const sortedRanges = uniqueRanges.sort((a, b) => {
        const yearA = parseInt(a.split('-')[0]);
        const yearB = parseInt(b.split('-')[0]);
        return yearB - yearA;
      });
      
      setYearRanges(sortedRanges);
      
      if (!selectedYearRange || !sortedRanges.includes(selectedYearRange)) {
        setSelectedYearRange(sortedRanges[0] || getCurrentYearRange());
      }
    } catch (error) {
      setYearRanges([getCurrentYearRange()]);
    }
  };

  const handleAddYearRange = () => {
    if (!newYearRange.trim()) {
      toast.error("Year range is required");
      return;
    }
    
    const yearRangePattern = /^\d{4}-\d{4}$/;
    if (!yearRangePattern.test(newYearRange)) {
      toast.error("Year range must be in format YYYY-YYYY (e.g., 2024-2025)");
      return;
    }
    
    if (yearRanges.includes(newYearRange)) {
      toast.error("Year range already exists");
      return;
    }
    
    const updatedRanges = [...yearRanges, newYearRange].sort((a, b) => {
      const yearA = parseInt(a.split('-')[0]);
      const yearB = parseInt(b.split('-')[0]);
      return yearB - yearA;
    });
    
    setYearRanges(updatedRanges);
    setSelectedYearRange(newYearRange);
    setNewYearRange("");
    setYearRangeDialogOpen(false);
    toast.success("Year range added successfully");
  };

  const handleDeleteYearRange = async (rangeToDelete: string) => {
    if (yearRanges.length === 1) {
      toast.error("Cannot delete the last year range");
      return;
    }

    if (!confirm(`Delete year range ${rangeToDelete}? This will not delete members, only hide this filter.`)) return;

    const updatedRanges = yearRanges.filter(r => r !== rangeToDelete);
    setYearRanges(updatedRanges);
    
    if (selectedYearRange === rangeToDelete) {
      setSelectedYearRange(updatedRanges[0]);
    }
    
    toast.success("Year range removed from filter");
  };

  const fetchChurchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, name")
        .order("name");
      if (error) throw error;
      setChurchMembers(data || []);
    } catch {
      // silent
    }
  };

  const filteredNameSuggestions = churchMembers.filter(m =>
    m.name.toLowerCase().includes(nameInput.toLowerCase())
  ).slice(0, 8);

  const fetchDepartments = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("department_members").select("department");
      if (error) throw error;
      const uniqueDepts = Array.from(new Set(data?.map(m => m.department) || []));
      const orderedDepts = ["deacons", "women", "youth", "children", "praise-&-worship", "mission", "building", "culture", "media", "auditors"];
      const deptLabelMap: Record<string, string> = { "children": "Church School", "praise-&-worship": "Worship Team" };
      const formatLabel = (d: string) => deptLabelMap[d] || d.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const deptObjects = orderedDepts.filter(d => uniqueDepts.includes(d)).map(d => ({
        value: d,
        label: formatLabel(d)
      }));
      const additionalDepts = uniqueDepts.filter(d => !orderedDepts.includes(d)).sort().map(d => ({
        value: d,
        label: formatLabel(d)
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

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );
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
      const {
        error: uploadError
      } = await supabase.storage.from("department-photos").upload(filePath, croppedImage, {
        upsert: true
      });
      if (uploadError) throw uploadError;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from("department-photos").getPublicUrl(filePath);
      const {
        error: updateError
      } = await supabase.from("department_members").update({
        profile_image_url: publicUrl
      }).eq("id", currentMemberId);
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
          await supabase.storage.from("department-photos").remove([fileName]);
        }
      }

      // Remove URL from database
      const {
        error
      } = await supabase.from("department_members").update({
        profile_image_url: null
      }).eq("id", member.id);
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
      const {
        error
      } = await supabase.from("department_members").delete().eq("id", id);
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
      const {
        data,
        error
      } = await supabase.from("department_members").select("id, name, department, created_at, display_order").order("created_at", {
        ascending: true
      });
      if (error) throw error;
      type Row = {
        id: string;
        name: string;
        department: string;
        created_at: string | null;
        display_order: number | null;
      };
      const map = new Map<string, {
        id: string;
        order: number;
        created: string;
      }>();
      const toDelete: string[] = [];
      (data as Row[] | null)?.forEach(row => {
        const key = `${row.name}__${row.department}`;
        const created = row.created_at || "1970-01-01T00:00:00Z";
        const order = row.display_order ?? 0;
        const current = map.get(key);
        if (!current) {
          map.set(key, {
            id: row.id,
            order,
            created
          });
        } else {
          const isBetter = order < current.order || order === current.order && created < current.created;
          if (isBetter) {
            toDelete.push(current.id);
            map.set(key, {
              id: row.id,
              order,
              created
            });
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
        const {
          error: delError
        } = await supabase.from("department_members").delete().in("id", chunk);
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
        const {
          error
        } = await supabase.from("department_members").update(memberData).eq("id", editingMember.id);
        if (error) throw error;
        toast.success("Member updated successfully");
      } else {
        const {
          error
        } = await supabase.from("department_members").insert(memberData);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Department Management
              </h1>
              <p className="text-muted-foreground mt-2">Manage members across departments and year ranges</p>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={newDeptDialogOpen} onOpenChange={setNewDeptDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Department
                  </Button>
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
                        onChange={e => setNewDeptName(e.target.value)} 
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
                  <Button onClick={() => { setEditingMember(null); setNameInput(""); setShowNameSuggestions(false); }} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingMember ? "Edit" : "Add"} Member</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveMember} className="space-y-4">
                    <div className="relative">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={nameInput || editingMember?.name || ""}
                        onChange={(e) => {
                          setNameInput(e.target.value);
                          setShowNameSuggestions(e.target.value.length > 0);
                        }}
                        onFocus={() => nameInput.length > 0 && setShowNameSuggestions(true)}
                        autoComplete="off"
                        required
                        placeholder="Type or select a member name..."
                      />
                      {showNameSuggestions && filteredNameSuggestions.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border bg-popover shadow-lg">
                          {filteredNameSuggestions.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                              onClick={() => {
                                setNameInput(m.name);
                                setShowNameSuggestions(false);
                              }}
                            >
                              {m.name}
                            </button>
                          ))}
                        </div>
                      )}
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <p className="text-2xl font-bold">{members.length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Department</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {departments.find(d => d.value === selectedDept)?.label || "N/A"}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Year Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <p className="text-2xl font-bold">{selectedYearRange}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{departments.length}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Filters & Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Department</Label>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Search Members</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Year Range</Label>
                <Dialog open={yearRangeDialogOpen} onOpenChange={setYearRangeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="w-3 h-3" />
                      Add Year Range
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Year Range</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="new-year-range">Year Range (YYYY-YYYY)</Label>
                        <Input
                          id="new-year-range"
                          value={newYearRange}
                          onChange={(e) => setNewYearRange(e.target.value)}
                          placeholder="e.g., 2025-2026"
                        />
                      </div>
                      <Button onClick={handleAddYearRange} className="w-full">
                        Add Year Range
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {yearRanges.map(range => (
                  <Badge
                    key={range}
                    variant={selectedYearRange === range ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm group relative"
                    onClick={() => setSelectedYearRange(range)}
                  >
                    {range}
                    {yearRanges.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteYearRange(range);
                        }}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Members ({filteredMembers.length})</span>
              {searchQuery && (
                <Badge variant="secondary">Filtered results</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No members match your search" : "No members found for this department"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredMembers.map(member => (
                  <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-3 space-y-2">
                      <div 
                        className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg overflow-hidden relative group cursor-pointer transition-transform hover:scale-105" 
                        onClick={() => navigate(`/department-member/${member.id}`)}
                      >
                        {member.profile_image_url ? (
                          <img 
                            src={member.profile_image_url} 
                            alt={member.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary">
                            {member.name.split(" ").map(n => n[0]).join("")}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <h3 
                          className="font-semibold text-sm truncate cursor-pointer hover:text-primary transition-colors" 
                          title={member.name}
                          onClick={() => navigate(`/department-member/${member.id}`)}
                        >
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
                          onChange={e => handleImageSelect(e, member.id)} 
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="px-2" 
                          onClick={() => {
                            setEditingMember(member);
                            setNameInput(member.name);
                            setShowNameSuggestions(false);
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
            )}
          </CardContent>
        </Card>
      </div>

      <ImageCropDialog 
        open={cropDialogOpen} 
        onOpenChange={setCropDialogOpen} 
        imageSrc={imageToCrop} 
        onCropComplete={handleCroppedImage} 
      />
    </div>
  );
};
export default AdminDepartments;