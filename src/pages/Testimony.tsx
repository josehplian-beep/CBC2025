import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Quote, Calendar, User, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

interface Testimony {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_role?: string;
  image_url?: string;
  created_at: string;
}

const Testimony = () => {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author_name: '',
    author_role: '',
    image_url: ''
  });

  useEffect(() => {
    checkAdminStatus();
    fetchTestimonies();
  }, []);

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

  const fetchTestimonies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('testimonials' as any)
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setTestimonies(data as any);
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

      const testimonyData = {
        title: formData.title,
        content: formData.content,
        author_name: formData.author_name,
        author_role: formData.author_role || null,
        image_url: imageUrl || null
      };

      const { error } = await supabase
        .from('testimonials' as any)
        .insert([testimonyData]);

      if (error) throw error;
      toast.success('Testimony created successfully');

      fetchTestimonies();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save testimony');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      author_name: '',
      author_role: '',
      image_url: ''
    });
    setImageFile(null);
    setImagePreview('');
  };

  const getExcerpt = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[300px] flex items-center justify-center overflow-hidden mt-20 bg-gradient-to-br from-primary via-primary/90 to-primary/70">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        <div className="relative z-10 text-center text-primary-foreground px-4 max-w-3xl">
          <Quote className="w-16 h-16 mx-auto mb-4 animate-in fade-in duration-500" />
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            Testimonies
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            Stories of faith, hope, and transformation in our community
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-7xl">
          {isAdmin && (
            <div className="mb-12 flex justify-center">
              <Button 
                onClick={() => { resetForm(); setDialogOpen(true); }}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Share Your Testimony
              </Button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-pulse space-y-4">
                <Quote className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Loading testimonies...</p>
              </div>
            </div>
          ) : testimonies.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <Quote className="w-20 h-20 mx-auto mb-6 text-muted-foreground" />
              <h3 className="text-2xl font-bold mb-3">No Testimonies Yet</h3>
              <p className="text-muted-foreground text-lg">
                Be the first to share your story of faith and inspire others in our community.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {testimonies.map((testimony, index) => (
                <Card 
                  key={testimony.id} 
                  className="overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/50 group animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {testimony.image_url && (
                    <Link to={`/testimony/${testimony.id}`} className="relative h-64 overflow-hidden bg-gradient-to-br from-muted/30 to-muted/50 flex items-center justify-center">
                      <img 
                        src={testimony.image_url} 
                        alt={testimony.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                          <ArrowRight className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </Link>
                  )}
                  <CardContent className="p-8 space-y-4 bg-card">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(testimony.created_at), 'MMMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {testimony.author_name}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {testimony.title}
                      </h3>
                      <p className="text-foreground/80 leading-relaxed line-clamp-4">
                        {getExcerpt(testimony.content, 200)}
                      </p>
                    </div>

                    {testimony.author_role && (
                      <div className="pt-2">
                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          {testimony.author_role}
                        </span>
                      </div>
                    )}

                    <Link 
                      to={`/testimony/${testimony.id}`}
                      className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all group/link pt-2"
                    >
                      Read Full Story
                      <ArrowRight className="w-5 h-5 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Share Your Testimony</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base">Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Give your testimony a meaningful title"
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
                placeholder="Share your journey, experiences, and how faith has impacted your life..."
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Separate paragraphs with blank lines for better readability
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author" className="text-base">Your Name *</Label>
                <Input
                  id="author"
                  required
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-base">Role (optional)</Label>
                <Input
                  id="role"
                  value={formData.author_role}
                  onChange={(e) => setFormData({ ...formData, author_role: e.target.value })}
                  placeholder="e.g., Church Member, Volunteer"
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
              <p className="text-sm text-muted-foreground">
                Recommended: High-quality image, max 5MB
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} size="lg">
                Cancel
              </Button>
              <Button type="submit" size="lg">
                Share Testimony
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Testimony;
