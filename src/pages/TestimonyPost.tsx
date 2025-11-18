import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Quote, Calendar, User, Share2, Facebook, Instagram, Link2, Edit, Trash2, Heart } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Testimony {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_role?: string;
  image_url?: string;
  created_at: string;
}

const TestimonyPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [testimony, setTestimony] = useState<Testimony | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [liked, setLiked] = useState(false);
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
        _role: 'admin'
      });
      setIsAdmin(data || false);
    }
  };

  const fetchTestimony = async () => {
    if (!id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('testimonials' as any)
      .select('*')
      .eq('id', id)
      .single();
    
    if (!error && data) {
      setTestimony(data as any);
      setFormData({
        title: data.title,
        content: data.content,
        author_name: data.author_name,
        author_role: data.author_role || '',
        image_url: data.image_url || ''
      });
      setImagePreview(data.image_url || '');
    } else {
      toast.error('Testimony not found');
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
        .from('testimonials' as any)
        .update({
          title: formData.title,
          content: formData.content,
          author_name: formData.author_name,
          author_role: formData.author_role || null,
          image_url: imageUrl || null
        })
        .eq('id', testimony.id);

      if (error) throw error;
      
      toast.success('Testimony updated successfully');
      setEditDialogOpen(false);
      fetchTestimony();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update testimony');
    }
  };

  const handleDelete = async () => {
    if (!testimony) return;

    const { error } = await supabase
      .from('testimonials' as any)
      .delete()
      .eq('id', testimony.id);

    if (error) {
      toast.error('Failed to delete testimony');
    } else {
      toast.success('Testimony deleted successfully');
      navigate('/testimony');
    }
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${testimony?.title} - Check out this inspiring testimony!`);
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
            <p className="text-muted-foreground">Loading testimony...</p>
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
            Back to All Testimonies
          </Link>
        </div>
      </div>

      {/* Hero Image Section */}
      {testimony.image_url && (
        <div 
          className="relative h-[400px] md:h-[500px] overflow-hidden bg-gradient-to-br from-muted/30 to-muted/50 flex items-center justify-center cursor-pointer group"
          onClick={() => window.open(testimony.image_url, '_blank')}
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
        <div className="bg-card rounded-2xl shadow-2xl p-8 md:p-12 -mt-32 relative z-10 border-2">
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

            <div className="flex items-center gap-2">
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
                className="text-foreground/90 leading-loose mb-6 pl-6 border-l-4 border-primary/30 text-lg"
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

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-3">Have Your Own Story to Share?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Your testimony could inspire and encourage others in their faith journey. We'd love to hear how God is working in your life.
            </p>
            <Link to="/testimony">
              <Button size="lg">
                Share Your Testimony
              </Button>
            </Link>
          </div>
        </div>
      </article>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Testimony</DialogTitle>
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
              <Label htmlFor="content" className="text-base">Your Story *</Label>
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
                <Label htmlFor="author" className="text-base">Author Name *</Label>
                <Input
                  id="author"
                  required
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-base">Role (optional)</Label>
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
                Update Testimony
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testimony</AlertDialogTitle>
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

      <Footer />
    </div>
  );
};

export default TestimonyPost;
