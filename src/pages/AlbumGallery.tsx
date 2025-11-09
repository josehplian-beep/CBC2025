import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, X } from "lucide-react";
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
                onClick={() => setSelectedPhoto(index)}
              >
                <img
                  src={photo.image_url}
                  alt={photo.caption || `Photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={selectedPhoto !== null} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-0">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          
          {selectedPhoto !== null && (
            <Carousel
              opts={{
                startIndex: selectedPhoto,
                loop: true,
              }}
              className="w-full h-full"
            >
              <CarouselContent className="h-full">
                {photos.map((photo, index) => (
                  <CarouselItem key={photo.id} className="h-full flex items-center justify-center p-8">
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <img
                        src={photo.image_url}
                        alt={photo.caption || `Photo ${index + 1}`}
                        className="max-w-full max-h-full object-contain"
                      />
                      {photo.caption && (
                        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-center bg-black/50 px-4 py-2 rounded-lg max-w-2xl">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-white/20 border-0 text-white hover:bg-white/30" />
              <CarouselNext className="right-4 bg-white/20 border-0 text-white hover:bg-white/30" />
            </Carousel>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AlbumGallery;
