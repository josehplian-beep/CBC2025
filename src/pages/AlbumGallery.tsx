import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, X, Download, Share2, ChevronRight, ImageIcon } from "lucide-react";
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
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(24);
  const PAGE_SIZE = 24;

  // Swipe & direction state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const directionRef = useRef(0);
  const [, forceRender] = useState(0);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Build an optimized thumbnail URL using Supabase image transforms when possible.
  // Falls back to the original URL if the image isn't served from Supabase storage.
  const getThumbUrl = useCallback((url: string, width = 600) => {
    if (!url) return url;
    if (url.includes("/storage/v1/object/public/")) {
      const transformed = url.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/"
      );
      const sep = transformed.includes("?") ? "&" : "?";
      return `${transformed}${sep}width=${width}&quality=70&resize=contain`;
    }
    return url;
  }, []);

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

  // Preload adjacent images for smoother lightbox transitions (next 2 + previous 1)
  useEffect(() => {
    if (photos.length === 0 || selectedPhoto === null) return;
    const preloadIndices = [
      (currentPhotoIndex + 1) % photos.length,
      (currentPhotoIndex + 2) % photos.length,
      (currentPhotoIndex - 1 + photos.length) % photos.length,
    ];
    preloadIndices.forEach((idx) => {
      if (photos[idx]) {
        const img = new Image();
        img.src = photos[idx].image_url;
      }
    });
  }, [currentPhotoIndex, selectedPhoto, photos]);

  // Reset visible count when album changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setLoadedImages(new Set());
  }, [albumId]);

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
      const isNumericSlug = /^\d+$/.test(albumId!);
      const query = isNumericSlug
        ? supabase.from('albums').select('*').eq('slug', parseInt(albumId!)).eq('is_published', true).single()
        : supabase.from('albums').select('*').eq('id', albumId).eq('is_published', true).single();
      const { data: albumData, error: albumError } = await query;
      if (albumError) throw albumError;
      setAlbum(albumData);
      setNewTitle(albumData.title);

      const { data: photosData, error: photosError } = await supabase
        .from('photos').select('*').eq('album_id', albumData.id).order('display_order');
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

  const handleSetCover = async () => {
    const photo = photos[currentPhotoIndex];
    if (!photo || !album) return;
    try {
      const { error } = await supabase.from('albums').update({ cover_image_url: photo.image_url }).eq('id', album.id);
      if (error) throw error;
      setAlbum({ ...album, cover_image_url: photo.image_url });
      toast({ title: "Cover Updated", description: "Album cover photo has been set." });
    } catch {
      toast({ title: "Error", description: "Failed to set cover photo.", variant: "destructive" });
    }
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhoto(index);
    setCurrentPhotoIndex(index);
  };

  const handlePrevPhoto = useCallback(() => {
    directionRef.current = -1;
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    forceRender((n) => n + 1);
  }, [photos.length]);

  const handleNextPhoto = useCallback(() => {
    directionRef.current = 1;
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    forceRender((n) => n + 1);
  }, [photos.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
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

  const getCollageClass = (index: number): string => {
    const pattern = index % 10;
    if (pattern === 0) return "col-span-1 row-span-1 md:col-span-1 md:row-span-2";
    if (pattern === 2) return "col-span-1 row-span-1 md:col-span-1 md:row-span-2";
    if (pattern === 7) return "col-span-1 row-span-1 md:col-span-1 md:row-span-2";
    return "col-span-1 row-span-1";
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="px-2 sm:px-4 py-20 mt-20">
          <div className="text-center mb-8 animate-pulse">
            <div className="h-8 w-48 bg-muted rounded-lg mx-auto mb-3" />
            <div className="h-4 w-32 bg-muted rounded mx-auto" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-muted rounded-sm"
                style={{
                  aspectRatio: i % 3 === 0 ? '3/4' : '4/3',
                  animationDelay: `${i * 60}ms`,
                }}
              />
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
    <PageTransition className="min-h-screen bg-muted/30 flex flex-col">
      <Navigation />

      <div className="flex-1 py-8 mt-20">
        {/* Album Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 px-4"
        >
          <Button variant="ghost" onClick={() => navigate('/media')} className="mb-4 group">
            <ChevronLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Media
          </Button>

          {editingTitle && isAdmin ? (
            <div className="flex gap-2 items-center justify-center max-w-2xl mx-auto">
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') updateTitle(); if (e.key === 'Escape') { setEditingTitle(false); setNewTitle(album.title); } }}
                className="text-3xl font-bold h-auto py-2 text-center" autoFocus />
              <Button onClick={updateTitle} size="sm">Save</Button>
              <Button onClick={() => { setEditingTitle(false); setNewTitle(album.title); }} size="sm" variant="ghost">Cancel</Button>
            </div>
          ) : (
            <h1
              className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-2"
              onClick={() => isAdmin && setEditingTitle(true)}
              style={{ cursor: isAdmin ? 'pointer' : 'default' }}
            >
              {album.title}
              {isAdmin && <span className="text-sm text-muted-foreground ml-2">(click to edit)</span>}
            </h1>
          )}
          {album.description && <p className="text-muted-foreground text-base">{album.description}</p>}
          <p className="text-sm text-muted-foreground mt-1">{photos.length} photos</p>

          <div className="flex justify-center gap-3 mt-4">
            <button onClick={handleShare} className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all duration-200 hover:scale-110">
              <Share2 className="w-4 h-4 text-primary" />
            </button>
          </div>
        </motion.div>

        {/* Photo Collage Grid */}
        {photos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No photos in this album yet</p>
          </div>
        ) : (
          <>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.02 } } }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 auto-rows-[minmax(140px,200px)] sm:auto-rows-[minmax(160px,240px)] md:auto-rows-[minmax(180px,260px)] gap-[3px] sm:gap-1 px-0 sm:px-1"
            >
              {photos.slice(0, visibleCount).map((photo, index) => (
                <motion.div
                  key={photo.id}
                  variants={{
                    hidden: { opacity: 0, scale: 0.92 },
                    visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } }
                  }}
                  className={`${getCollageClass(index)} relative overflow-hidden cursor-pointer group bg-muted`}
                  onClick={() => handlePhotoClick(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  {!loadedImages.has(index) && (
                    <div className="absolute inset-0 bg-muted animate-pulse" />
                  )}
                  <img
                    src={getThumbUrl(photo.image_url, 600)}
                    alt={photo.caption || `Photo ${index + 1}`}
                    className={`w-full h-full object-cover transition-all duration-500 ease-out group-hover:brightness-110 ${
                      loadedImages.has(index) ? 'opacity-100' : 'opacity-0'
                    }`}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => handleImageLoad(index)}
                    onError={() => handleImageLoad(index)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                      {index + 1}
                    </span>
                  </div>
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-xs truncate">{photo.caption}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
            {visibleCount < photos.length && (
              <div className="flex flex-col items-center gap-2 mt-8 px-4">
                <p className="text-sm text-muted-foreground">
                  Showing {visibleCount} of {photos.length} photos
                </p>
                <Button
                  onClick={() => setVisibleCount((c) => Math.min(c + PAGE_SIZE, photos.length))}
                  size="lg"
                  className="rounded-full px-8"
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
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
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted rounded-full" onClick={() => setSelectedPhoto(null)}>
                  <X className="w-5 h-5" />
                </Button>
                <span className="text-foreground/70 text-sm font-medium">
                  {currentPhotoIndex + 1} / {photos.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isAdmin && (
                  <Button variant="ghost" size="sm" className="text-foreground hover:bg-muted gap-1.5 text-xs" onClick={handleSetCover}>
                    <ImageIcon className="w-4 h-4" />
                    Set as Cover
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="hidden sm:flex text-foreground hover:bg-muted rounded-full" onClick={handleShare}>
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden sm:flex text-foreground hover:bg-muted rounded-full" onClick={handleDownload}>
                  <Download className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Photo */}
            <div className="flex-1 flex items-center justify-center p-4 pt-16 pb-24 sm:p-8 sm:pt-16 sm:pb-28">
              <AnimatePresence mode="popLayout" initial={false}>
                {selectedPhoto !== null && photos[currentPhotoIndex] && (
                  <motion.div
                    key={currentPhotoIndex}
                    initial={{ opacity: 0, x: directionRef.current * 80, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: directionRef.current * -80, scale: 0.95 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="relative w-full max-w-5xl mx-auto"
                  >
                    <div className="w-full h-[60vh] sm:h-[70vh] rounded-2xl overflow-hidden bg-muted shadow-2xl flex items-center justify-center">
                      <img
                        src={photos[currentPhotoIndex].image_url}
                        alt={photos[currentPhotoIndex].caption || `Photo ${currentPhotoIndex + 1}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    {photos[currentPhotoIndex].caption && (
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.3 }}
                        className="text-foreground/80 text-center text-sm sm:text-base mt-4 px-4"
                      >
                        {photos[currentPhotoIndex].caption}
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation arrows */}
            <Button
              variant="ghost" size="icon"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-foreground bg-muted/50 hover:bg-muted backdrop-blur-sm h-10 w-10 sm:h-12 sm:w-12 rounded-full transition-transform hover:scale-110"
              onClick={handlePrevPhoto}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-foreground bg-muted/50 hover:bg-muted backdrop-blur-sm h-10 w-10 sm:h-12 sm:w-12 rounded-full transition-transform hover:scale-110"
              onClick={handleNextPhoto}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>

            {/* Mobile bottom action bar */}
            <div className="sm:hidden absolute bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-4 p-4 bg-gradient-to-t from-background/90 to-transparent">
              <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted rounded-full" onClick={handleShare}>
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted rounded-full" onClick={handleDownload}>
                <Download className="w-5 h-5" />
              </Button>
            </div>

            {/* Thumbnail strip */}
            <div className="hidden sm:block absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent">
              <div className="flex gap-2 overflow-x-auto pb-2 justify-center scrollbar-hide">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => {
                      directionRef.current = index > currentPhotoIndex ? 1 : -1;
                      setCurrentPhotoIndex(index);
                      forceRender((n) => n + 1);
                    }}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      index === currentPhotoIndex
                        ? 'border-primary scale-110 shadow-lg'
                        : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img src={getThumbUrl(photo.image_url, 120)} alt={`Thumb ${index + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </PageTransition>
  );
};

export default AlbumGallery;
