import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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

  // Swipe state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    if (albumId) {
      checkAdminStatus();
      fetchAlbumAndPhotos();
    }
  }, [albumId]);

  // Keyboard navigation
  useEffect(() => {
    if (selectedPhoto === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevPhoto();
      if (e.key === "ArrowRight") handleNextPhoto();
      if (e.key === "Escape") setSelectedPhoto(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedPhoto, photos.length]);

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      setIsAdmin(roles?.some(r => r.role === 'administrator' || r.role === 'editor') || false);
    }
  };

  const fetchAlbumAndPhotos = async () => {
    setLoading(true);
    try {
      const { data: albumData, error: albumError } = await supabase
        .from('albums').select('*').eq('id', albumId).eq('is_published', true).single();
      if (albumError) throw albumError;
      setAlbum(albumData);
      setNewTitle(albumData.title);

      const { data: photosData, error: photosError } = await supabase
        .from('photos').select('*').eq('album_id', albumId).order('display_order');
      if (photosError) throw photosError;
      setPhotos(photosData || []);
    } catch {
      toast({ title: "Error", description: "Failed to load album.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateTitle = async () => {
    if (!album || !newTitle.trim()) return;
    try {
      const { error } = await supabase.from('albums').update({ title: newTitle.trim() }).eq('id', album.id);
      if (error) throw error;
      setAlbum({ ...album, title: newTitle.trim() });
      setEditingTitle(false);
      toast({ title: "Success", description: "Album title updated." });
    } catch {
      toast({ title: "Error", description: "Failed to update title.", variant: "destructive" });
    }
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhoto(index);
    setCurrentPhotoIndex(index);
  };

  const handlePrevPhoto = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  const handleNextPhoto = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) { diff > 0 ? handleNextPhoto() : handlePrevPhoto(); }
  };

  const handleDownload = async () => {
    const photo = photos[currentPhotoIndex];
    if (!photo) return;
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
      toast({ title: "Downloaded", description: "Photo downloaded successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to download photo.", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    const shareData = { title: album?.title || 'Photo', url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { copyToClipboard(); }
    } else { copyToClipboard(); }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link Copied", description: "Album link copied to clipboard." });
  };

  // Bento grid pattern — varies item sizes for visual interest
  const getBentoClass = (index: number): string => {
    const pattern = index % 8;
    if (pattern === 0) return "col-span-1 row-span-1 md:col-span-2 md:row-span-2";
    if (pattern === 3) return "col-span-1 row-span-1 md:col-span-1 md:row-span-2";
    if (pattern === 5) return "col-span-1 row-span-1 md:col-span-2 md:row-span-1";
    return "col-span-1 row-span-1";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 mt-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse aspect-square bg-muted rounded-xl" />
            ))}
          </div>
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <div className="flex-1 container mx-auto px-4 py-8 mt-20">
        <Button variant="ghost" onClick={() => navigate('/media')} className="mb-6 -ml-2">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Media
        </Button>

        {/* Album Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {editingTitle && isAdmin ? (
            <div className="flex gap-2 items-center max-w-2xl">
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') updateTitle(); if (e.key === 'Escape') { setEditingTitle(false); setNewTitle(album.title); } }}
                className="text-3xl font-bold h-auto py-2" autoFocus />
              <Button onClick={updateTitle} size="sm">Save</Button>
              <Button onClick={() => { setEditingTitle(false); setNewTitle(album.title); }} size="sm" variant="ghost">Cancel</Button>
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
          {album.description && <p className="text-muted-foreground text-lg">{album.description}</p>}
          <p className="text-sm text-muted-foreground mt-2">{photos.length} photos</p>
        </motion.div>

        {/* Bento Grid */}
        {photos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No photos in this album yet</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[minmax(160px,1fr)] gap-3"
          >
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
                className={`${getBentoClass(index)} relative rounded-xl overflow-hidden cursor-pointer group`}
                onClick={() => handlePhotoClick(index)}
              >
                {/* Uniform square crop via aspect-square + object-cover */}
                <img
                  src={photo.image_url}
                  alt={photo.caption || `Photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Theme color overlay on hover */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/25 transition-colors duration-300" />
                {/* Caption on hover */}
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-primary/70 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-primary-foreground text-xs sm:text-sm truncate">{photo.caption}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Lightbox with swipe support */}
      <Dialog open={selectedPhoto !== null} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-full w-full h-full p-0 bg-background/95 backdrop-blur-xl border-0 sm:max-w-full sm:h-screen">
          <div
            className="relative w-full h-full flex flex-col"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-background/90 to-transparent">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted" onClick={() => setSelectedPhoto(null)}>
                  <X className="w-5 h-5" />
                </Button>
                <span className="text-foreground/70 text-sm font-medium">
                  {currentPhotoIndex + 1} / {photos.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted" onClick={handleShare}>
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted" onClick={handleDownload}>
                  <Download className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Half-View Featured Photo */}
            <div className="flex-1 flex items-center justify-center p-4 pt-16 pb-24 sm:p-8 sm:pt-16 sm:pb-28">
              <AnimatePresence mode="wait">
                {selectedPhoto !== null && photos[currentPhotoIndex] && (
                  <motion.div
                    key={currentPhotoIndex}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                    className="relative w-full max-w-5xl mx-auto"
                  >
                    <div className="w-full h-[60vh] sm:h-[70vh] rounded-2xl overflow-hidden bg-muted shadow-2xl flex items-center justify-center">
                      <img
                        src={photos[currentPhotoIndex].image_url}
                        alt={photos[currentPhotoIndex].caption || `Photo ${currentPhotoIndex + 1}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    {/* Caption below the image */}
                    {photos[currentPhotoIndex].caption && (
                      <p className="text-foreground/80 text-center text-sm sm:text-base mt-4 px-4">
                        {photos[currentPhotoIndex].caption}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation arrows */}
            <Button
              variant="ghost" size="icon"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-foreground bg-muted/50 hover:bg-muted backdrop-blur-sm h-10 w-10 sm:h-12 sm:w-12 rounded-full"
              onClick={handlePrevPhoto}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-foreground bg-muted/50 hover:bg-muted backdrop-blur-sm h-10 w-10 sm:h-12 sm:w-12 rounded-full"
              onClick={handleNextPhoto}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>

            {/* Thumbnail strip */}
            <div className="hidden sm:block absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent">
              <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentPhotoIndex
                        ? 'border-primary scale-110 shadow-lg'
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={photo.image_url} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
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
