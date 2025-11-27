import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Quote, Calendar, User, ArrowRight, X, Search, BookOpen, Mic, BookMarked } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

interface Message {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_role?: string;
  image_url?: string;
  created_at: string;
}

const Testimony = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author_name: '',
    author_role: '',
    image_url: ''
  });

  useEffect(() => {
    checkAdminStatus();
    fetchMessages();
  }, []);

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

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('testimonials' as any)
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setMessages(data as any);
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
        const fileName = `message-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('albums')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('albums')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      const messageData = {
        title: formData.title,
        content: formData.content,
        author_name: formData.author_name,
        author_role: formData.author_role || null,
        image_url: imageUrl || null
      };

      const { error } = await supabase
        .from('testimonials' as any)
        .insert([messageData]);

      if (error) throw error;
      toast.success('Message created successfully');

      fetchMessages();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save message');
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

  // Filter messages based on active tab and search
  const filteredMessages = messages.filter((message) => {
    const matchesSearch = 
      searchQuery === "" ||
      message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (message.author_role && message.author_role.toLowerCase().includes(searchQuery.toLowerCase()));

    // Tab-based filtering
    if (activeTab === "recent") return matchesSearch;
    if (activeTab === "topic") return matchesSearch; // Future: filter by topic/category
    if (activeTab === "speaker") return matchesSearch; // Future: filter by speaker
    if (activeTab === "scripture") return matchesSearch; // Future: filter by scripture reference

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[300px] flex items-center justify-center overflow-hidden mt-20 bg-gradient-to-br from-primary via-primary/90 to-primary/70">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        <div className="relative z-10 text-center text-primary-foreground px-4 max-w-3xl">
          <BookOpen className="w-16 h-16 mx-auto mb-4 animate-in fade-in duration-500" />
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            Messages
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            Sermons, teachings, and messages that inspire and transform lives
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-7xl">
          {isAdmin && (
            <div className="mb-8 flex justify-center">
              <Button 
                onClick={() => { resetForm(); setDialogOpen(true); }}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Share a Message
              </Button>
            </div>
          )}

          {/* Tabs and Search */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
              <TabsList className="grid w-full md:w-auto grid-cols-4 bg-muted">
                <TabsTrigger value="recent" className="gap-2">
                  Recent
                </TabsTrigger>
                <TabsTrigger value="topic" className="gap-2">
                  Topic
                </TabsTrigger>
                <TabsTrigger value="speaker" className="gap-2">
                  Speaker
                </TabsTrigger>
                <TabsTrigger value="scripture" className="gap-2">
                  Scripture
                </TabsTrigger>
              </TabsList>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="text-center py-20">
                  <div className="animate-pulse space-y-4">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">Loading messages...</p>
                  </div>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-20 max-w-md mx-auto">
                  <BookOpen className="w-20 h-20 mx-auto mb-6 text-muted-foreground" />
                  <h3 className="text-2xl font-bold mb-3">
                    {searchQuery ? "No Messages Found" : "No Messages Yet"}
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    {searchQuery 
                      ? "Try adjusting your search terms or filters." 
                      : "Check back soon for inspiring messages and sermons."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMessages.map((message, index) => (
                    <Card 
                      key={message.id} 
                      className="overflow-hidden hover:shadow-2xl transition-all duration-500 border hover:border-primary/50 group animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {message.image_url ? (
                        <div 
                          className="relative h-56 overflow-hidden cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            setLightboxImage(message.image_url!);
                            setLightboxOpen(true);
                          }}
                        >
                          <img 
                            src={message.image_url} 
                            alt={message.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                      ) : (
                        <div className="relative h-56 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-primary/30" />
                        </div>
                      )}
                      
                      <CardContent className="p-5 space-y-3">
                        <h3 className="font-bold text-lg leading-tight line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
                          {message.title}
                        </h3>
                        
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mic className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{message.author_name}</span>
                          </div>
                          {message.author_role && (
                            <div className="flex items-center gap-2">
                              <BookMarked className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{message.author_role}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{format(new Date(message.created_at), 'MMM d, yyyy')}</span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                          {getExcerpt(message.content, 100)}
                        </p>

                        <Link 
                          to={`/testimony/${message.id}`}
                          className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all group/link pt-2"
                        >
                          Read More
                          <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Share a Message</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base">Message Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Faith: The Story of a God and His People"
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content" className="text-base">Message Description *</Label>
              <Textarea
                id="content"
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                placeholder="Provide a summary or key points of the message..."
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Share the main themes, scriptures, or takeaways from this message
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author" className="text-base">Speaker/Author *</Label>
                <Input
                  id="author"
                  required
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  placeholder="Pastor John Smith"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-base">Scripture/Topic (optional)</Label>
                <Input
                  id="role"
                  value={formData.author_role}
                  onChange={(e) => setFormData({ ...formData, author_role: e.target.value })}
                  placeholder="e.g., John 3:16 or Advent Series"
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
                Share Message
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
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
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
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
              src={lightboxImage}
              alt="Full size"
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

      <Footer />
    </div>
  );
};

export default Testimony;
