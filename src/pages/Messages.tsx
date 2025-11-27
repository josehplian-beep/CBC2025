import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Quote, Calendar, User, ArrowRight, X, Search, BookOpen, Mic, BookMarked, Filter } from "lucide-react";
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

const Messages = () => {
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
  const [selectedWriter, setSelectedWriter] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedScripture, setSelectedScripture] = useState<string>("all");
  const [selectedSeries, setSelectedSeries] = useState<string>("all");
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

  // Extract unique writers
  const uniqueWriters = Array.from(new Set(messages.map(m => m.author_name))).sort();

  // Extract series (topics ending with "Series" or similar patterns)
  const uniqueSeries = Array.from(
    new Set(
      messages
        .map(m => m.author_role)
        .filter(role => role && (role.toLowerCase().includes('series') || role.toLowerCase().includes('collection')))
    )
  ).sort();

  // Extract unique topics from author_role field
  const uniqueTopics = Array.from(
    new Set(
      messages
        .map(m => m.author_role)
        .filter(role => role && role.trim() !== '')
    )
  ).sort();

  // Extract scripture references (looking for book names and chapter:verse patterns)
  const scripturePattern = /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s*\d+(?::\d+)?/gi;
  
  const uniqueScriptures = Array.from(
    new Set(
      messages.flatMap(m => {
        const scriptures: string[] = [];
        // Check title
        const titleMatches = m.title.match(scripturePattern);
        if (titleMatches) scriptures.push(...titleMatches);
        // Check author_role (topic/scripture field)
        if (m.author_role) {
          const roleMatches = m.author_role.match(scripturePattern);
          if (roleMatches) scriptures.push(...roleMatches);
        }
        return scriptures;
      })
    )
  ).sort();

  // Filter messages based on active tab and search
  const filteredMessages = messages.filter((message) => {
    const matchesSearch = 
      searchQuery === "" ||
      message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (message.author_role && message.author_role.toLowerCase().includes(searchQuery.toLowerCase()));

    // Tab-based filtering
    if (activeTab === "recent") {
      return matchesSearch;
    }
    
    if (activeTab === "writer") {
      const matchesWriter = selectedWriter === "all" || message.author_name === selectedWriter;
      return matchesSearch && matchesWriter;
    }
    
    if (activeTab === "topic") {
      const matchesTopic = selectedTopic === "all" || message.author_role === selectedTopic;
      return matchesSearch && matchesTopic;
    }
    
    if (activeTab === "scripture") {
      if (selectedScripture === "all") return matchesSearch;
      
      // Check if message contains the selected scripture reference
      const titleMatch = message.title.match(scripturePattern);
      const roleMatch = message.author_role?.match(scripturePattern);
      const allScriptures = [...(titleMatch || []), ...(roleMatch || [])];
      
      const matchesScripture = allScriptures.some(s => s === selectedScripture);
      return matchesSearch && matchesScripture;
    }

    return matchesSearch;
  });

  // Group messages by series
  const messagesBySeries = messages.reduce((acc, message) => {
    if (message.author_role && (message.author_role.toLowerCase().includes('series') || message.author_role.toLowerCase().includes('collection'))) {
      const series = message.author_role;
      if (!acc[series]) {
        acc[series] = [];
      }
      acc[series].push(message);
    }
    return acc;
  }, {} as Record<string, Message[]>);

  // Reset secondary filters when tab changes
  useEffect(() => {
    setSelectedWriter("all");
    setSelectedTopic("all");
    setSelectedScripture("all");
    setSelectedSeries("all");
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden mt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20 animate-pulse"></div>
        </div>
        <div className="relative z-10 text-center text-primary-foreground px-4 max-w-4xl">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <BookOpen className="w-20 h-20 mx-auto mb-6 drop-shadow-2xl" />
            <h1 className="font-display text-6xl md:text-7xl font-bold mb-6 drop-shadow-lg">
              Messages
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/95 font-medium max-w-2xl mx-auto">
              Sermons, teachings, and messages that inspire and transform lives
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
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

          {/* Series Showcase */}
          {Object.keys(messagesBySeries).length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-display font-bold mb-6 flex items-center gap-3">
                <BookMarked className="w-8 h-8 text-primary" />
                Message Series
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(messagesBySeries).map(([series, seriesMessages], index) => (
                  <div
                    key={series}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-2xl animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                          <BookMarked className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full">
                          {seriesMessages.length} {seriesMessages.length === 1 ? 'Message' : 'Messages'}
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {series}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Explore this collection of related messages
                      </p>
                      <Button
                        variant="ghost"
                        className="w-full justify-between group/btn hover:bg-primary/10"
                        onClick={() => {
                          setActiveTab("topic");
                          setSelectedTopic(series);
                        }}
                      >
                        View Series
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs and Search */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
              <TabsList className="grid w-full md:w-auto grid-cols-4 bg-muted/50 backdrop-blur-sm p-1 rounded-xl shadow-lg">
                <TabsTrigger value="recent" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                  <Calendar className="w-4 h-4" />
                  Recent
                </TabsTrigger>
                <TabsTrigger value="topic" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                  <BookMarked className="w-4 h-4" />
                  Topic
                </TabsTrigger>
                <TabsTrigger value="writer" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                  <User className="w-4 h-4" />
                  Writer
                </TabsTrigger>
                <TabsTrigger value="scripture" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
                  <BookOpen className="w-4 h-4" />
                  Scripture
                </TabsTrigger>
              </TabsList>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Secondary Filters */}
            {activeTab === "writer" && uniqueWriters.length > 0 && (
              <div className="mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Filter className="h-4 w-4 text-primary" />
                <Select value={selectedWriter} onValueChange={setSelectedWriter}>
                  <SelectTrigger className="w-full md:w-[300px] bg-card border-primary/20 hover:border-primary/40 transition-colors">
                    <SelectValue placeholder="Filter by writer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Writers</SelectItem>
                    {uniqueWriters.map((writer) => (
                      <SelectItem key={writer} value={writer}>
                        {writer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedWriter !== "all" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedWriter("all")}
                    className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            )}

            {activeTab === "topic" && uniqueTopics.length > 0 && (
              <div className="mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Filter className="h-4 w-4 text-primary" />
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger className="w-full md:w-[300px] bg-card border-primary/20 hover:border-primary/40 transition-colors">
                    <SelectValue placeholder="Filter by topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {uniqueTopics.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTopic !== "all" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTopic("all")}
                    className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            )}

            {activeTab === "scripture" && uniqueScriptures.length > 0 && (
              <div className="mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Filter className="h-4 w-4 text-primary" />
                <Select value={selectedScripture} onValueChange={setSelectedScripture}>
                  <SelectTrigger className="w-full md:w-[300px] bg-card border-primary/20 hover:border-primary/40 transition-colors">
                    <SelectValue placeholder="Filter by scripture" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scriptures</SelectItem>
                    {uniqueScriptures.map((scripture) => (
                      <SelectItem key={scripture} value={scripture}>
                        {scripture}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedScripture !== "all" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedScripture("all")}
                    className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            )}

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredMessages.map((message, index) => (
                    <Link
                      key={message.id}
                      to={`/testimony/${message.id}`}
                      className="group block hover-scale"
                    >
                      <Card 
                        className="overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 border-border/50 hover:border-primary/50 bg-card/95 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-8"
                        style={{ animationDelay: `${index * 75}ms` }}
                      >
                        <div className="relative">
                          {message.image_url ? (
                            <div className="relative aspect-video overflow-hidden bg-muted">
                              <img 
                                src={message.image_url} 
                                alt={message.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </div>
                          ) : (
                            <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:via-primary/15 group-hover:to-primary/10 transition-all duration-500">
                              <BookOpen className="w-20 h-20 text-primary/30 group-hover:text-primary/50 transition-colors duration-500" />
                            </div>
                          )}
                          {message.author_role && (message.author_role.toLowerCase().includes('series') || message.author_role.toLowerCase().includes('collection')) && (
                            <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
                              <BookMarked className="w-3 h-3" />
                              SERIES
                            </div>
                          )}
                        </div>
                        
                        <CardContent className="p-6">
                          <h3 className="font-display font-bold text-xl leading-tight group-hover:text-primary transition-colors duration-300 mb-3 line-clamp-2">
                            {message.title}
                          </h3>
                          
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1.5">
                              <User className="w-4 h-4" />
                              <span className="font-medium">{message.author_name}</span>
                            </div>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(message.created_at), 'MMM d, yyyy')}
                            </div>
                          </div>
                          
                          {message.author_role && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                              <BookMarked className="w-3 h-3" />
                              {message.author_role}
                            </div>
                          )}
                          
                          <div className="mt-4 flex items-center gap-2 text-primary font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Read More
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
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
                <Label htmlFor="author" className="text-base">Writer/Author *</Label>
                <Input
                  id="author"
                  required
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  placeholder="e.g., Pastor John Smith"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-base">Scripture/Topic (optional)</Label>
                <Input
                  id="role"
                  value={formData.author_role}
                  onChange={(e) => setFormData({ ...formData, author_role: e.target.value })}
                  placeholder="e.g., Genesis 1:1 or Advent Series"
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

export default Messages;
