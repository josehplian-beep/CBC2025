import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Image as ImageIcon, Upload, Trash2, Eye, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  created_at: string;
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
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumDescription, setNewAlbumDescription] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccessAndLoadAlbums();
  }, []);

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

      const isAdmin = roles?.some(r => r.role === 'admin');
      
      if (!isAdmin) {
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

  const createAlbum = async () => {
    if (!newAlbumTitle.trim()) {
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
          title: newAlbumTitle.trim(),
          description: newAlbumDescription.trim() || null,
          created_by: session?.user.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Album created successfully.",
      });

      setNewAlbumTitle("");
      setNewAlbumDescription("");
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, albumId: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate file types and sizes
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `File "${file.name}" is not a supported image format. Please upload JPG, PNG, GIF, or WebP files.`,
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `File "${file.name}" exceeds 10MB limit. Please choose a smaller file.`,
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

        // Set first photo as cover if no cover exists
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

  const deletePhoto = async (photoId: string, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      // Extract file path from URL
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

  const updateAlbumTitle = async (albumId: string) => {
    if (!editTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('albums')
        .update({ title: editTitle.trim() })
        .eq('id', albumId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Album title updated successfully.",
      });

      await loadAlbums();
      setEditingAlbumId(null);
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!hasAccess) {
    return (
      <AdminLayout>
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
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="font-display text-4xl font-bold mb-2">Manage Albums</h1>
            <p className="text-muted-foreground">Create albums and upload photos</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Album
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Album</DialogTitle>
                <DialogDescription>
                  Add a new photo album to your church gallery
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Album Title *</Label>
                  <Input
                    id="title"
                    value={newAlbumTitle}
                    onChange={(e) => setNewAlbumTitle(e.target.value)}
                    placeholder="e.g., Christmas Celebration 2024"
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newAlbumDescription}
                    onChange={(e) => setNewAlbumDescription(e.target.value)}
                    placeholder="Optional description..."
                    disabled={creating}
                  />
                </div>
                <Button onClick={createAlbum} disabled={creating} className="w-full">
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Album"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {albums.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-display text-xl font-semibold mb-2">No Albums Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first album to start uploading photos
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Album
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Albums List */}
            <div className="lg:col-span-1 space-y-4">
              {albums.map((album) => (
                <Card
                  key={album.id}
                  className={`cursor-pointer transition-all ${
                    selectedAlbum?.id === album.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedAlbum(album);
                    loadPhotos(album.id);
                  }}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {editingAlbumId === album.id ? (
                          <div className="flex gap-2 items-center mb-2">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') updateAlbumTitle(album.id);
                                if (e.key === 'Escape') setEditingAlbumId(null);
                              }}
                              className="text-lg font-semibold"
                              autoFocus
                            />
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAlbumTitle(album.id);
                              }}
                            >
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAlbumId(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <CardTitle 
                            className="text-lg cursor-pointer hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAlbumId(album.id);
                              setEditTitle(album.title);
                            }}
                          >
                            {album.title}
                          </CardTitle>
                        )}
                        {album.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {album.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePublish(album);
                          }}
                        >
                          <Eye className={`w-4 h-4 ${album.is_published ? 'text-green-600' : 'text-gray-400'}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAlbum(album.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {album.cover_image_url && (
                    <div className="px-6 pb-4">
                      <img
                        src={album.cover_image_url}
                        alt={album.title}
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Photos Grid */}
            <div className="lg:col-span-2">
              {selectedAlbum ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>{selectedAlbum.title}</CardTitle>
                        <CardDescription>{photos.length} photos</CardDescription>
                      </div>
                      <div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, selectedAlbum.id)}
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
                    </div>
                  </CardHeader>
                  <CardContent>
                    {photos.length === 0 ? (
                      <div className="text-center py-12">
                        <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No photos yet. Upload some!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {photos.map((photo) => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={photo.image_url}
                              alt={photo.caption || "Photo"}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deletePhoto(photo.id, photo.image_url)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Select an album to manage photos</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAlbums;
