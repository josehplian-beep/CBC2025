import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface StaffBiography {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  image_url?: string;
  biography_content: string;
  ministry_focus?: string[];
  spouse_name?: string;
  children_count?: number;
  hobbies?: string;
  slug: string;
  display_order: number;
  is_published: boolean;
}

const AdminStaff = () => {
  const [staff, setStaff] = useState<StaffBiography[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffBiography | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffBiography | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    biography_content: '',
    ministry_focus: '',
    spouse_name: '',
    children_count: '',
    hobbies: '',
    slug: '',
    display_order: '0',
    is_published: true
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchStaff();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!data) {
      navigate('/');
      toast.error('Access denied. Admin privileges required.');
      return;
    }

    setIsAdmin(true);
  };

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('staff_biographies' as any)
      .select('*')
      .order('display_order', { ascending: true });
    
    if (!error && data) {
      setStaff(data as any);
    }
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let imageUrl = selectedStaff?.image_url || '';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `staff-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('department-profiles')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('department-profiles')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      const ministryFocusArray = formData.ministry_focus
        .split('\n')
        .filter(item => item.trim() !== '');

      const staffData = {
        name: formData.name,
        role: formData.role,
        email: formData.email || null,
        phone: formData.phone || null,
        image_url: imageUrl || null,
        biography_content: formData.biography_content,
        ministry_focus: ministryFocusArray.length > 0 ? ministryFocusArray : null,
        spouse_name: formData.spouse_name || null,
        children_count: formData.children_count ? parseInt(formData.children_count) : null,
        hobbies: formData.hobbies || null,
        slug: formData.slug,
        display_order: parseInt(formData.display_order) || 0,
        is_published: formData.is_published
      };

      if (selectedStaff) {
        const { error } = await supabase
          .from('staff_biographies' as any)
          .update(staffData)
          .eq('id', selectedStaff.id);

        if (error) throw error;
        toast.success('Staff biography updated successfully');
      } else {
        const { error } = await supabase
          .from('staff_biographies' as any)
          .insert([staffData]);

        if (error) throw error;
        toast.success('Staff biography created successfully');
      }

      fetchStaff();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save staff biography');
    }
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;

    const { error } = await supabase
      .from('staff_biographies' as any)
      .delete()
      .eq('id', staffToDelete.id);

    if (error) {
      toast.error('Failed to delete staff biography');
    } else {
      toast.success('Staff biography deleted successfully');
      fetchStaff();
    }
    setDeleteDialogOpen(false);
    setStaffToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      email: '',
      phone: '',
      biography_content: '',
      ministry_focus: '',
      spouse_name: '',
      children_count: '',
      hobbies: '',
      slug: '',
      display_order: '0',
      is_published: true
    });
    setImageFile(null);
    setImagePreview('');
    setSelectedStaff(null);
  };

  const openEditDialog = (staffMember: StaffBiography) => {
    setSelectedStaff(staffMember);
    setFormData({
      name: staffMember.name,
      role: staffMember.role,
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      biography_content: staffMember.biography_content,
      ministry_focus: staffMember.ministry_focus?.join('\n') || '',
      spouse_name: staffMember.spouse_name || '',
      children_count: staffMember.children_count?.toString() || '',
      hobbies: staffMember.hobbies || '',
      slug: staffMember.slug,
      display_order: (staffMember.display_order ?? 0).toString(),
      is_published: staffMember.is_published
    });
    setImagePreview(staffMember.image_url || '');
    setDialogOpen(true);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="pt-32 pb-16 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground">
            Manage Staff Biographies
          </h1>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff Biography
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading staff biographies...</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No Staff Biographies Yet</h3>
              <p className="text-muted-foreground">Click "Add Staff Biography" to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map((staffMember) => (
                <Card key={staffMember.id} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                  {staffMember.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={staffMember.image_url} 
                        alt={staffMember.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{staffMember.name}</h3>
                        <p className="text-sm text-primary font-medium">{staffMember.role}</p>
                      </div>
                      {!staffMember.is_published && (
                        <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                          Draft
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {staffMember.biography_content}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(staffMember)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setStaffToDelete(staffMember);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedStaff ? 'Edit' : 'Add'} Staff Biography</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Input
                  id="role"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug * (e.g., rev-van-duh-ceu)</Label>
              <Input
                id="slug"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="lowercase-with-hyphens"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biography">Biography Content *</Label>
              <Textarea
                id="biography"
                required
                value={formData.biography_content}
                onChange={(e) => setFormData({ ...formData, biography_content: e.target.value })}
                rows={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ministry_focus">Ministry Focus (one per line)</Label>
              <Textarea
                id="ministry_focus"
                value={formData.ministry_focus}
                onChange={(e) => setFormData({ ...formData, ministry_focus: e.target.value })}
                rows={4}
                placeholder="Youth Ministry&#10;Worship and Music&#10;Outreach"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spouse">Spouse Name</Label>
                <Input
                  id="spouse"
                  value={formData.spouse_name}
                  onChange={(e) => setFormData({ ...formData, spouse_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="children">Children Count</Label>
                <Input
                  id="children"
                  type="number"
                  value={formData.children_count}
                  onChange={(e) => setFormData({ ...formData, children_count: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hobbies">Hobbies/Interests</Label>
              <Input
                id="hobbies"
                value={formData.hobbies}
                onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Profile Image</Label>
              {imagePreview && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 mb-2">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="is_published">Published</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedStaff ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Biography</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{staffToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default AdminStaff;
