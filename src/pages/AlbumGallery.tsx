import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, X, Download, Share2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Photo {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
}

const AlbumGallery = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    if (albumId) {
      checkAdminStatus();
      fetchAlbumAndPhotos();
    }
  }, [albumId]);

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      
      setIsAdmin(roles?.some(r => r.role === 'admin') || false);
    }
  };

  const fetchAlbumAndPhotos = async () => {
    setLoading(true);
    try {
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .select('*')
        .eq('id', albumId)
        .eq('is_published', true)
        .single();

      if (albumError) throw albumError;
      setAlbum(albumData);
      setNewTitle(albumData.title);

      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('album_id', albumId)
        .order('display_order');

      if (photosError) throw photosError;
      setPhotos(photosData || []);
    } catch (error) {
      console.error('Error fetching album:', error);
      toast({
        title: "Error",
        description: "Failed to load album. It may not exist or is not published.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTitle = async () => {
    if (!album || !newTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('albums')
        .update({ title: newTitle.trim() })
        .eq('id', album.id);

      if (error) throw error;

      setAlbum({ ...album, title: newTitle.trim() });
      setEditingTitle(false);
      toast({
        title: "Success",
        description: "Album title updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update album title.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhoto(index);
    setCurrentPhotoIndex(index);
  };

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleDownload = async () => {
    if (photos[currentPhotoIndex]) {
      const photo = photos[currentPhotoIndex];
      try {
        const response = await fetch(photo.image_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${album?.title || 'photo'}-${currentPhotoIndex + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({
          title: "Downloaded",
          description: "Photo downloaded successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to download photo.",
          variant: "destructive",
        });
      }
    }
  };

  const handleShare = async () => {
    if (photos[currentPhotoIndex]) {
      const photo = photos[currentPhotoIndex];
      const shareData = {
        title: album?.title || 'Photo',
        text: photo.caption || `Photo from ${album?.title}`,
        url: window.location.href,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          toast({
            title: "Shared",
            description: "Photo shared successfully.",
          });
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            copyToClipboard();
          }
        }
      } else {
        copyToClipboard();
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Album link copied to clipboard.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 mt-20 text-center">
          <p className="text-muted-foreground">Loading album...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 mt-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Album Not Found</h1>
          <Button onClick={() => navigate('/media')}>Back to Media</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 mt-20">
        <Button
          variant="ghost"
          onClick={() => navigate('/media')}
          className="mb-6 -ml-2"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Media
        </Button>

        <div className="mb-8">
          {editingTitle && isAdmin ? (
            <div className="flex gap-2 items-center max-w-2xl">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updateTitle();
                  if (e.key === 'Escape') {
                    setEditingTitle(false);
                    setNewTitle(album.title);
                  }
                }}
                className="text-3xl font-bold h-auto py-2"
                autoFocus
              />
              <Button onClick={updateTitle} size="sm">Save</Button>
              <Button 
                onClick={() => {
                  setEditingTitle(false);
                  setNewTitle(album.title);
                }} 
                size="sm" 
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <h1 
              className="font-display text-4xl md:text-5xl font-bold mb-2"
              onClick={() => isAdmin && setEditingTitle(true)}
              style={{ cursor: isAdmin ? 'pointer' : 'default' }}
            >
              {album.title}
              {isAdmin && <span className="text-sm text-muted-foreground ml-2">(click to edit)</span>}
            </h1>
          )}
          {album.description && (
            <p className="text-muted-foreground text-lg">{album.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">{photos.length} photos</p>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No photos in this album yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative"
                onClick={() => handlePhotoClick(index)}
              >
                <img
                  src={photo.image_url}
                  alt={photo.caption || `Photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern Photo Viewer */}
      <Dialog open={selectedPhoto !== null} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-full w-full h-full p-0 bg-black border-0 sm:max-w-full sm:h-screen">
          <div className="relative w-full h-full flex flex-col">
            {/* Header with controls */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
                <span className="text-white text-sm font-medium">
                  {currentPhotoIndex + 1} / {photos.length}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleShare}
                >
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleDownload}
                >
                  <Download className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Main image area */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
              {selectedPhoto !== null && photos[currentPhotoIndex] && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={photos[currentPhotoIndex].image_url}
                    alt={photos[currentPhotoIndex].caption || `Photo ${currentPhotoIndex + 1}`}
                    className="max-w-full max-h-full object-contain transition-opacity duration-300"
                  />
                  
                  {/* Caption */}
                  {photos[currentPhotoIndex].caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-center text-sm sm:text-base">
                        {photos[currentPhotoIndex].caption}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm h-10 w-10 sm:h-12 sm:w-12"
              onClick={handlePrevPhoto}
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm h-10 w-10 sm:h-12 sm:w-12"
              onClick={handleNextPhoto}
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </Button>

            {/* Thumbnail strip for desktop */}
            <div className="hidden sm:block absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                      index === currentPhotoIndex
                        ? 'border-white scale-110'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={photo.image_url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AlbumGallery;
