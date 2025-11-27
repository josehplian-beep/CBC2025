import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Quote, Calendar, User, Share2, Facebook, Instagram, Link2, Edit, Trash2, Heart, X, Plus, BookMarked, ArrowRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_role?: string;
  image_url?: string;
  created_at: string;
}

type Testimony = Tables<'testimonials'>;

const TestimonyPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [testimony, setTestimony] = useState<Testimony | null>(null);
  const [relatedMessages, setRelatedMessages] = useState<Message[]>([]);
  const [seriesMessages, setSeriesMessages] = useState<Message[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [liked, setLiked] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [textSize, setTextSize] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author_name: '',
    author_role: '',
    image_url: ''
  });

  useEffect(() => {
    checkAdminStatus();
    fetchTestimony();
  }, [id]);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'administrator'
      });
      setIsAdmin(data || false);
    }
  };

  const fetchTestimony = async () => {
    if (!id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!error && data) {
      setTestimony(data);
      setFormData({
        title: data.title,
        content: data.content,
        author_name: data.author_name,
        author_role: data.author_role || '',
        image_url: data.image_url || ''
      });
      setImagePreview(data.image_url || '');
      
      // Fetch related messages in the same series
      if (data.author_role && (data.author_role.toLowerCase().includes('series') || data.author_role.toLowerCase().includes('collection'))) {
        const { data: seriesData } = await supabase
          .from('testimonials')
          .select('id, title, author_name, author_role, image_url, created_at')
          .eq('author_role', data.author_role)
          .eq('is_published', true)
          .order('created_at', { ascending: true });
        
        if (seriesData) {
          setSeriesMessages(seriesData as Message[]);
        }
      }
    } else {
      toast.error('Message not found');
      navigate('/testimony');
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimony) return;

    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `testimony-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('albums')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('albums')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('testimonials')
        .update({
          title: formData.title,
          content: formData.content,
          author_name: formData.author_name,
          author_role: formData.author_role || null,
          image_url: imageUrl || null
        })
        .eq('id', testimony.id);

      if (error) throw error;
      
      toast.success('Message updated successfully');
      setEditDialogOpen(false);
      fetchTestimony();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update testimony');
    }
  };

  const handleDelete = async () => {
    if (!testimony) return;

    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', testimony.id);

    if (error) {
      toast.error('Failed to delete message');
    } else {
      toast.success('Message deleted successfully');
      navigate('/testimony');
    }
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${testimony?.title} - Check out this inspiring message!`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
  };

  const shareToInstagram = () => {
    toast.info('Instagram does not support direct link sharing. Link copied to clipboard!');
    navigator.clipboard.writeText(window.location.href);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const toggleLike = () => {
    setLiked(!liked);
    toast.success(liked ? 'Removed from favorites' : 'Added to favorites');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-pulse space-y-4">
            <Quote className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Loading message...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!testimony) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header Navigation */}
      <div className="bg-muted/30 border-b mt-20">
        <div className="container mx-auto px-4 py-4">
          <Link to="/testimony" className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all font-medium">
            <ArrowLeft className="w-5 h-5" />
            Back to All Messages
          </Link>
        </div>
      </div>

      {/* Hero Image Section */}
      {testimony.image_url && (
        <div 
          className="relative h-[400px] md:h-[500px] overflow-hidden bg-gradient-to-br from-muted/30 to-muted/50 flex items-center justify-center cursor-pointer group"
          onClick={() => setLightboxOpen(true)}
        >
          <img 
            src={testimony.image_url} 
            alt={testimony.title}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-100 group-hover:opacity-50 transition-opacity duration-300" />
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Click to view full size
          </div>
        </div>
      )}

      {/* Main Content */}
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 -mt-32 relative z-10 border-2 border-border/50" style={{ backgroundColor: 'hsl(var(--card) / 0.98)' }}>
          {/* Header */}
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div className="flex-1">
              <Quote className="w-12 h-12 text-primary mb-4" />
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
                {testimony.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <span className="font-semibold text-foreground">{testimony.author_name}</span>
                </div>
                {testimony.author_role && (
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {testimony.author_role}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {format(new Date(testimony.created_at), 'MMMM d, yyyy')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Text Size Controls */}
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTextSize(prev => Math.max(prev - 0.1, 0.8))}
                  className="h-8 w-8"
                  title="Decrease text size"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <text x="12" y="18" fontSize="14" textAnchor="middle" fill="currentColor">A</text>
                  </svg>
                </Button>
                <span className="text-xs font-medium min-w-[3rem] text-center">
                  {Math.round(textSize * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTextSize(prev => Math.min(prev + 0.1, 1.5))}
                  className="h-8 w-8"
                  title="Increase text size"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <text x="12" y="18" fontSize="18" textAnchor="middle" fill="currentColor" fontWeight="bold">A</text>
                  </svg>
                </Button>
              </div>

              <Button
                variant={liked ? "default" : "outline"}
                size="icon"
                onClick={toggleLike}
                className="transition-all"
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={shareToFacebook}>
                    <Facebook className="w-4 h-4 mr-2" />
                    Share to Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={shareToInstagram}>
                    <Instagram className="w-4 h-4 mr-2" />
                    Share to Instagram
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyLink}>
                    <Link2 className="w-4 h-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <Edit className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {testimony.content.split('\n\n').map((paragraph, idx) => (
              <p 
                key={idx} 
                className="text-foreground/95 leading-relaxed mb-6 text-lg"
                style={{ fontSize: `${textSize}rem`, lineHeight: '1.8' }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t">
            <div className="bg-muted/50 rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Written by</p>
              <p className="text-xl font-bold">{testimony.author_name}</p>
              {testimony.author_role && (
                <p className="text-muted-foreground">{testimony.author_role}</p>
              )}
            </div>
          </div>
        </div>

        {/* Series Navigation */}
        {seriesMessages.length > 1 && testimony.author_role && (
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/20 rounded-xl">
                  <BookMarked className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold">Message Series</h3>
                  <p className="text-muted-foreground">{testimony.author_role}</p>
                </div>
              </div>
              
              <div className="grid gap-3">
                {seriesMessages.map((msg, index) => {
                  const isCurrentMessage = msg.id === testimony.id;
                  const currentIndex = seriesMessages.findIndex(m => m.id === testimony.id);
                  
                  return (
                    <Link
                      key={msg.id}
                      to={`/testimony/${msg.id}`}
                      className={`group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                        isCurrentMessage 
                          ? 'bg-primary text-primary-foreground shadow-lg' 
                          : 'bg-card hover:bg-primary/10 border border-border hover:border-primary/30'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        isCurrentMessage 
                          ? 'bg-primary-foreground text-primary' 
                          : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${isCurrentMessage ? 'text-primary-foreground' : ''}`}>
                          {msg.title}
                        </p>
                        <p className={`text-sm truncate ${isCurrentMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          {msg.author_name} • {format(new Date(msg.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      
                      {isCurrentMessage && (
                        <div className="flex-shrink-0 px-3 py-1 bg-primary-foreground/20 rounded-full text-xs font-bold">
                          Current
                        </div>
                      )}
                      
                      {!isCurrentMessage && (
                        <ArrowRight className="flex-shrink-0 w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      )}
                    </Link>
                  );
                })}
              </div>
              
              {testimony.id && seriesMessages.findIndex(m => m.id === testimony.id) < seriesMessages.length - 1 && (
                <div className="mt-6 pt-6 border-t border-primary/20">
                  <Link
                    to={`/testimony/${seriesMessages[seriesMessages.findIndex(m => m.id === testimony.id) + 1].id}`}
                    className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all font-semibold"
                  >
                    Next Message
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-3">Explore More Messages</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Discover more inspiring sermons and teachings that strengthen faith and transform lives.
            </p>
            <Link to="/testimony">
              <Button size="lg">
                View All Messages
              </Button>
            </Link>
          </div>
        </div>
      </article>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Message</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base">Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content" className="text-base">Message Content *</Label>
              <Textarea
                id="content"
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="resize-none"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author" className="text-base">Writer/Author *</Label>
                <Input
                  id="author"
                  required
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-base">Scripture/Topic (optional)</Label>
                <Input
                  id="role"
                  value={formData.author_role}
                  onChange={(e) => setFormData({ ...formData, author_role: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-base">Featured Image (optional)</Label>
              {imagePreview && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 mb-3">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} size="lg">
                Cancel
              </Button>
              <Button type="submit" size="lg">
                Update Message
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{testimony.title}"? This action cannot be undone.
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

      {/* Image Lightbox */}
      {testimony?.image_url && (
        <Dialog open={lightboxOpen} onOpenChange={(open) => { setLightboxOpen(open); if (!open) setZoomLevel(1); }}>
          <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 overflow-hidden bg-black/98 border-0">
            <button
              onClick={() => { setLightboxOpen(false); setZoomLevel(1); }}
              className="absolute top-4 right-4 z-50 text-white hover:text-white bg-black/80 rounded-full p-3 backdrop-blur-sm transition-colors shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                className="text-white hover:text-white bg-black/80 rounded-full p-3 backdrop-blur-sm transition-all hover:bg-black shadow-lg"
                title="Zoom In"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.max(prev - 0.25, 0.5)); }}
                className="text-white hover:text-white bg-black/80 rounded-full p-3 backdrop-blur-sm transition-all hover:bg-black shadow-lg"
                title="Zoom Out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="text-white hover:text-white bg-black/80 rounded-lg px-3 py-2 backdrop-blur-sm transition-all hover:bg-black shadow-lg text-xs font-medium"
                title="Reset Zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
            </div>

            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <img
                src={testimony.image_url}
                alt={testimony.title}
                className="transition-transform duration-300"
                style={{ 
                  transform: `scale(${zoomLevel})`,
                  maxWidth: zoomLevel > 1 ? 'none' : '100%',
                  maxHeight: zoomLevel > 1 ? 'none' : '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Footer />
    </div>
  );
};

export default TestimonyPost;
