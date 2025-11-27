import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, Plus, Image as ImageIcon, Upload, Trash2, Eye, EyeOff, 
  AlertTriangle, Search, Filter, Edit2, Save, X, Calendar,
  Grid3x3, List, BarChart3, Settings2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  created_at: string;
  year_range: string | null;
}

interface Photo {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

const AdminAlbums = () => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Form states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    year_range: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
    is_published: true
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccessAndLoadAlbums();
  }, []);

  useEffect(() => {
    filterAlbums();
  }, [albums, searchQuery, yearFilter, statusFilter]);

  const checkAccessAndLoadAlbums = async () => {
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

      const hasManageAccess = roles?.some(r => 
        r.role === 'administrator' || r.role === 'editor'
      );
      
      if (!hasManageAccess) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);
      await loadAlbums();
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

  const loadAlbums = async () => {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAlbums(data || []);
  };

  const loadPhotos = async (albumId: string) => {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('album_id', albumId)
      .order('display_order');

    if (error) throw error;
    setPhotos(data || []);
  };

  const filterAlbums = () => {
    let filtered = [...albums];

    if (searchQuery) {
      filtered = filtered.filter(album =>
        album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        album.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (yearFilter !== "all") {
      filtered = filtered.filter(album => album.year_range === yearFilter);
    }

    if (statusFilter === "published") {
      filtered = filtered.filter(album => album.is_published);
    } else if (statusFilter === "unpublished") {
      filtered = filtered.filter(album => !album.is_published);
    }

    setFilteredAlbums(filtered);
  };

  const getYearRanges = () => {
    const years = new Set(albums.map(a => a.year_range).filter(Boolean));
    return Array.from(years).sort().reverse();
  };

  const getStats = () => {
    return {
      total: albums.length,
      published: albums.filter(a => a.is_published).length,
      unpublished: albums.filter(a => !a.is_published).length,
      totalPhotos: albums.reduce((sum, album) => {
        // This would need to be calculated properly, for now returning 0
        return sum;
      }, 0)
    };
  };

  const createAlbum = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Album title is required.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('albums')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          year_range: formData.year_range,
          is_published: formData.is_published,
          created_by: session?.user.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Album created successfully.",
      });

      setFormData({
        title: "",
        description: "",
        year_range: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
        is_published: true
      });
      setShowCreateDialog(false);
      await loadAlbums();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const updateAlbum = async () => {
    if (!selectedAlbum || !formData.title.trim()) return;

    try {
      const { error } = await supabase
        .from('albums')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          year_range: formData.year_range,
          is_published: formData.is_published
        })
        .eq('id', selectedAlbum.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Album updated successfully.",
      });

      await loadAlbums();
      setShowEditDialog(false);
      setSelectedAlbum(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, albumId: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `File "${file.name}" is not a supported image format.`,
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `File "${file.name}" exceeds 10MB limit.`,
          variant: "destructive",
        });
        return;
      }
    }

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${albumId}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('albums')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('albums')
          .getPublicUrl(fileName);

        const { error: insertError } = await supabase
          .from('photos')
          .insert({
            album_id: albumId,
            image_url: publicUrl,
            display_order: i,
            created_by: session?.user.id,
          });

        if (insertError) throw insertError;

        if (i === 0) {
          const album = albums.find(a => a.id === albumId);
          if (!album?.cover_image_url) {
            await supabase
              .from('albums')
              .update({ cover_image_url: publicUrl })
              .eq('id', albumId);
          }
        }
      }

      toast({
        title: "Success",
        description: `${files.length} photo(s) uploaded successfully.`,
      });

      await loadAlbums();
      if (selectedAlbum) {
        await loadPhotos(selectedAlbum.id);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Upload Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const updatePhotoCaption = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('photos')
        .update({ caption: photoCaption.trim() || null })
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Caption updated successfully.",
      });

      if (selectedAlbum) {
        await loadPhotos(selectedAlbum.id);
      }
      setEditingPhotoId(null);
      setPhotoCaption("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const deletePhoto = async (photoId: string, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      const urlParts = imageUrl.split('/albums/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('albums').remove([filePath]);
      }

      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Photo deleted successfully.",
      });

      if (selectedAlbum) {
        await loadPhotos(selectedAlbum.id);
      }
      await loadAlbums();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const togglePublish = async (album: Album) => {
    try {
      const { error } = await supabase
        .from('albums')
        .update({ is_published: !album.is_published })
        .eq('id', album.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Album ${album.is_published ? 'unpublished' : 'published'} successfully.`,
      });

      await loadAlbums();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const deleteAlbum = async (albumId: string) => {
    if (!confirm("Are you sure? This will delete the album and all its photos.")) return;

    try {
      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', albumId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Album deleted successfully.",
      });

      await loadAlbums();
      setSelectedAlbum(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (album: Album) => {
    setSelectedAlbum(album);
    setFormData({
      title: album.title,
      description: album.description || "",
      year_range: album.year_range || new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
      is_published: album.is_published
    });
    setShowEditDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              You need admin privileges to manage photo albums.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-4xl font-bold mb-2">Manage Albums</h1>
            <p className="text-muted-foreground">Create and organize your church photo albums</p>
          </div>
          
          <Button onClick={() => setShowCreateDialog(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New Album
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Total Albums</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Published</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.published}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Unpublished</CardDescription>
              <CardTitle className="text-3xl text-orange-600">{stats.unpublished}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Year Ranges</CardDescription>
              <CardTitle className="text-3xl">{getYearRanges().length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search albums..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {getYearRanges().map(year => (
                    <SelectItem key={year} value={year || ""}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="unpublished">Unpublished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Albums List */}
      {filteredAlbums.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-display text-xl font-semibold mb-2">
              {albums.length === 0 ? "No Albums Yet" : "No Albums Found"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {albums.length === 0 
                ? "Create your first album to start uploading photos"
                : "Try adjusting your filters"}
            </p>
            {albums.length === 0 && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Album
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlbums.map((album) => (
            <Card key={album.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="relative aspect-video bg-muted">
                {album.cover_image_url ? (
                  <img
                    src={album.cover_image_url}
                    alt={album.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  {album.is_published ? (
                    <Badge className="bg-green-600">Published</Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                </div>
              </div>

              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-1">{album.title}</CardTitle>
                    {album.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {album.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {album.year_range && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {album.year_range}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAlbum(album);
                      loadPhotos(album.id);
                    }}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Manage Photos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(album)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublish(album)}
                  >
                    {album.is_published ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Publish
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAlbum(album.id)}
                    className="text-destructive hover:text-destructive"
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

      {/* Create Album Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Album</DialogTitle>
            <DialogDescription>
              Add a new photo album to your church gallery
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-title">Album Title *</Label>
              <Input
                id="create-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Christmas Celebration 2024"
                disabled={creating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-year">Year Range *</Label>
              <Input
                id="create-year"
                value={formData.year_range}
                onChange={(e) => setFormData({ ...formData, year_range: e.target.value })}
                placeholder="e.g., 2024-2025"
                disabled={creating}
              />
              <p className="text-xs text-muted-foreground">
                Use format: YYYY-YYYY (e.g., 2024-2025)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
                disabled={creating}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="create-published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                disabled={creating}
              />
              <Label htmlFor="create-published">Publish immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={createAlbum} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Album"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Album Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Album</DialogTitle>
            <DialogDescription>
              Update album information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Album Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Album title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-year">Year Range *</Label>
              <Input
                id="edit-year"
                value={formData.year_range}
                onChange={(e) => setFormData({ ...formData, year_range: e.target.value })}
                placeholder="e.g., 2024-2025"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Album description..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
              <Label htmlFor="edit-published">Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateAlbum}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Photos Dialog */}
      <Dialog open={!!selectedAlbum && !showEditDialog} onOpenChange={(open) => !open && setSelectedAlbum(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAlbum?.title}</DialogTitle>
            <DialogDescription>
              {photos.length} photo{photos.length !== 1 ? 's' : ''} in this album
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => selectedAlbum && handleFileUpload(e, selectedAlbum.id)}
                className="hidden"
                id="photo-upload"
                disabled={uploading}
              />
              <Button
                asChild
                disabled={uploading}
              >
                <label htmlFor="photo-upload" className="cursor-pointer">
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photos
                    </>
                  )}
                </label>
              </Button>
            </div>

            {photos.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No photos yet</p>
                <Button asChild size="sm">
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First Photo
                  </label>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={photo.image_url}
                        alt={photo.caption || "Photo"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingPhotoId(photo.id);
                          setPhotoCaption(photo.caption || "");
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deletePhoto(photo.id, photo.image_url)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {photo.caption && editingPhotoId !== photo.id && (
                      <p className="text-xs text-center mt-1 line-clamp-2">{photo.caption}</p>
                    )}

                    {editingPhotoId === photo.id && (
                      <div className="mt-2 space-y-2">
                        <Input
                          value={photoCaption}
                          onChange={(e) => setPhotoCaption(e.target.value)}
                          placeholder="Add caption..."
                          className="text-xs"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => updatePhotoCaption(photo.id)}
                            className="flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingPhotoId(null);
                              setPhotoCaption("");
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAlbums;
