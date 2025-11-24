import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MessageSquare, Plus, Edit, Trash2, User, Calendar, Eye, EyeOff, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Testimony {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_role?: string;
  image_url?: string;
  is_published: boolean;
  created_at: string;
}

const AdminTestimonies = () => {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedTestimony, setSelectedTestimony] = useState<Testimony | null>(null);
  const [testimonyToDelete, setTestimonyToDelete] = useState<Testimony | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showUnpublished, setShowUnpublished] = useState(true);
  const [selectedTestimonyIds, setSelectedTestimonyIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author_name: "",
    author_role: "",
    image_url: "",
    is_published: true,
  });

  useEffect(() => {
    fetchTestimonies();
  }, []);

  const fetchTestimonies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTestimonies(data);
    } else if (error) {
      toast.error("Failed to load testimonies");
    }
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
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

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url || null;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `testimony-${Math.random()}.${fileExt}`;
    const { error: uploadError, data } = await supabase.storage
      .from("albums")
      .upload(fileName, imageFile);

    if (uploadError) {
      toast.error("Failed to upload image");
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("albums")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const imageUrl = await uploadImage();

      const testimonyData = {
        title: formData.title,
        content: formData.content,
        author_name: formData.author_name,
        author_role: formData.author_role || null,
        image_url: imageUrl,
        is_published: formData.is_published,
      };

      if (selectedTestimony) {
        const { error } = await supabase
          .from("testimonials")
          .update(testimonyData)
          .eq("id", selectedTestimony.id);

        if (error) throw error;
        toast.success("Testimony updated successfully");
      } else {
        const { error } = await supabase
          .from("testimonials")
          .insert([testimonyData]);

        if (error) throw error;
        toast.success("Testimony created successfully");
      }

      resetForm();
      fetchTestimonies();
    } catch (error: any) {
      toast.error(error.message || "Failed to save testimony");
    }
  };

  const handleEdit = (testimony: Testimony) => {
    setSelectedTestimony(testimony);
    setFormData({
      title: testimony.title,
      content: testimony.content,
      author_name: testimony.author_name,
      author_role: testimony.author_role || "",
      image_url: testimony.image_url || "",
      is_published: testimony.is_published,
    });
    setImagePreview(testimony.image_url || "");
    setDialogOpen(true);
  };

  const handleTogglePublish = async (testimony: Testimony) => {
    try {
      const { error } = await supabase
        .from("testimonials")
        .update({ is_published: !testimony.is_published })
        .eq("id", testimony.id);

      if (error) throw error;
      
      toast.success(
        testimony.is_published ? "Testimony unpublished" : "Testimony published"
      );
      fetchTestimonies();
    } catch (error: any) {
      toast.error(error.message || "Failed to update testimony");
    }
  };

  const handleDelete = async () => {
    if (!testimonyToDelete) return;

    try {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", testimonyToDelete.id);

      if (error) throw error;

      toast.success("Testimony deleted successfully");
      fetchTestimonies();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete testimony");
    } finally {
      setDeleteDialogOpen(false);
      setTestimonyToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTestimonyIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .in("id", selectedTestimonyIds);

      if (error) throw error;

      toast.success(`${selectedTestimonyIds.length} testimon(y/ies) deleted successfully`);
      setSelectedTestimonyIds([]);
      fetchTestimonies();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete testimonies");
    } finally {
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleBulkPublish = async (publish: boolean) => {
    if (selectedTestimonyIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("testimonials")
        .update({ is_published: publish })
        .in("id", selectedTestimonyIds);

      if (error) throw error;

      toast.success(
        `${selectedTestimonyIds.length} testimon(y/ies) ${publish ? "published" : "unpublished"} successfully`
      );
      setSelectedTestimonyIds([]);
      fetchTestimonies();
    } catch (error: any) {
      toast.error(error.message || "Failed to update testimonies");
    }
  };

  const toggleTestimonySelection = (testimonyId: string) => {
    setSelectedTestimonyIds(prev =>
      prev.includes(testimonyId)
        ? prev.filter(id => id !== testimonyId)
        : [...prev, testimonyId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTestimonyIds.length === filteredTestimonies.length) {
      setSelectedTestimonyIds([]);
    } else {
      setSelectedTestimonyIds(filteredTestimonies.map(t => t.id));
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      author_name: "",
      author_role: "",
      image_url: "",
      is_published: true,
    });
    setSelectedTestimony(null);
    setImageFile(null);
    setImagePreview("");
    setDialogOpen(false);
  };

  const filteredTestimonies = showUnpublished 
    ? testimonies 
    : testimonies.filter(t => t.is_published);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="font-display text-4xl font-bold mb-2">Manage Testimonies</h1>
          <p className="text-muted-foreground">Create, edit, and manage testimonies</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Testimony
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTestimony ? "Edit Testimony" : "Create New Testimony"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Testimony Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="author_name">Author Name *</Label>
                  <Input
                    id="author_name"
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="author_role">Author Role (Optional)</Label>
                  <Input
                    id="author_role"
                    value={formData.author_role}
                    onChange={(e) => setFormData({ ...formData, author_role: e.target.value })}
                    placeholder="e.g., Church Member"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image">Featured Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                        setFormData({ ...formData, image_url: "" });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published" className="cursor-pointer">
                  Publish immediately
                </Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedTestimony ? "Update Testimony" : "Create Testimony"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Switch
            id="show-unpublished"
            checked={showUnpublished}
            onCheckedChange={setShowUnpublished}
          />
          <Label htmlFor="show-unpublished" className="cursor-pointer">
            Show unpublished testimonies
          </Label>
        </div>

        {selectedTestimonyIds.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
            <span className="text-sm font-medium">
              {selectedTestimonyIds.length} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkPublish(true)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Publish
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkPublish(false)}
              className="gap-2"
            >
              <EyeOff className="h-4 w-4" />
              Unpublish
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTestimonyIds([])}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading testimonies...</p>
        </div>
      ) : filteredTestimonies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No testimonies found. Create your first testimony!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {filteredTestimonies.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <Checkbox
                checked={selectedTestimonyIds.length === filteredTestimonies.length}
                onCheckedChange={toggleSelectAll}
                id="select-all"
              />
              <Label htmlFor="select-all" className="cursor-pointer text-sm font-medium">
                Select all testimonies
              </Label>
            </div>
          )}
          <div className="grid gap-4">
            {filteredTestimonies.map((testimony) => (
              <Card key={testimony.id} className={`hover:shadow-lg transition-shadow ${!testimony.is_published ? 'border-dashed border-2' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="flex items-start pt-1">
                      <Checkbox
                        checked={selectedTestimonyIds.includes(testimony.id)}
                        onCheckedChange={() => toggleTestimonySelection(testimony.id)}
                      />
                    </div>
                    {testimony.image_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={testimony.image_url}
                          alt={testimony.title}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-xl">{testimony.title}</h3>
                          {!testimony.is_published && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                              Draft
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {testimony.author_name}
                            {testimony.author_role && ` - ${testimony.author_role}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(testimony.created_at), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTogglePublish(testimony)}
                          title={testimony.is_published ? "Unpublish" : "Publish"}
                        >
                          {testimony.is_published ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(testimony)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setTestimonyToDelete(testimony);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                      {testimony.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testimony</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{testimonyToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTestimonyToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Testimonies</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTestimonyIds.length} testimon(y/ies)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTestimonies;
