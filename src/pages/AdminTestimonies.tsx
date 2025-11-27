import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, Edit, Trash2, User, Calendar, Eye, EyeOff, X, Search, Filter, FileText, FileCheck, FileClock, BookOpen, Mic, BookMarked } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Message {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_role?: string;
  image_url?: string;
  is_published: boolean;
  created_at: string;
}

const AdminTestimonies = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author_name: "",
    author_role: "",
    image_url: "",
    is_published: true,
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMessages(data);
    } else if (error) {
      toast.error("Failed to load messages");
    }
    setLoading(false);
  };

  // Get unique years from messages
  const availableYears = Array.from(
    new Set(messages.map(m => new Date(m.created_at).getFullYear()))
  ).sort((a, b) => b - a);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
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

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url || null;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `message-${Math.random()}.${fileExt}`;
    const { error: uploadError, data } = await supabase.storage
      .from("albums")
      .upload(fileName, imageFile);

    if (uploadError) {
      toast.error("Failed to upload image");
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("albums")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const imageUrl = await uploadImage();

      const messageData = {
        title: formData.title,
        content: formData.content,
        author_name: formData.author_name,
        author_role: formData.author_role || null,
        image_url: imageUrl,
        is_published: formData.is_published,
      };

      if (selectedMessage) {
        const { error } = await supabase
          .from("testimonials")
          .update(messageData)
          .eq("id", selectedMessage.id);

        if (error) throw error;
        toast.success("Message updated successfully");
      } else {
        const { error } = await supabase
          .from("testimonials")
          .insert([messageData]);

        if (error) throw error;
        toast.success("Message created successfully");
      }

      resetForm();
      fetchMessages();
    } catch (error: any) {
      toast.error(error.message || "Failed to save message");
    }
  };

  const handleEdit = (message: Message) => {
    setSelectedMessage(message);
    setFormData({
      title: message.title,
      content: message.content,
      author_name: message.author_name,
      author_role: message.author_role || "",
      image_url: message.image_url || "",
      is_published: message.is_published,
    });
    setImagePreview(message.image_url || "");
    setDialogOpen(true);
  };

  const handleTogglePublish = async (message: Message) => {
    try {
      const { error } = await supabase
        .from("testimonials")
        .update({ is_published: !message.is_published })
        .eq("id", message.id);

      if (error) throw error;
      
      toast.success(
        message.is_published ? "Message unpublished" : "Message published"
      );
      fetchMessages();
    } catch (error: any) {
      toast.error(error.message || "Failed to update message");
    }
  };

  const handleDelete = async () => {
    if (!messageToDelete) return;

    try {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", messageToDelete.id);

      if (error) throw error;

      toast.success("Message deleted successfully");
      fetchMessages();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete message");
    } finally {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMessageIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .in("id", selectedMessageIds);

      if (error) throw error;

      toast.success(`${selectedMessageIds.length} message(s) deleted successfully`);
      setSelectedMessageIds([]);
      fetchMessages();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete messages");
    } finally {
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleBulkPublish = async (publish: boolean) => {
    if (selectedMessageIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("testimonials")
        .update({ is_published: publish })
        .in("id", selectedMessageIds);

      if (error) throw error;

      toast.success(
        `${selectedMessageIds.length} message(s) ${publish ? "published" : "unpublished"} successfully`
      );
      setSelectedMessageIds([]);
      fetchMessages();
    } catch (error: any) {
      toast.error(error.message || "Failed to update messages");
    }
  };

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessageIds(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMessageIds.length === filteredMessages.length) {
      setSelectedMessageIds([]);
    } else {
      setSelectedMessageIds(filteredMessages.map(t => t.id));
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      author_name: "",
      author_role: "",
      image_url: "",
      is_published: true,
    });
    setSelectedMessage(null);
    setImageFile(null);
    setImagePreview("");
    setDialogOpen(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setActiveTab("all");
    setYearFilter("all");
  };

  // Filter messages based on search, tab, and year
  let filteredMessages = messages.filter((message) => {
    const matchesSearch = 
      message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.author_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = 
      activeTab === "all" ? true :
      activeTab === "published" ? message.is_published :
      activeTab === "drafts" ? !message.is_published :
      true;

    const matchesYear = 
      yearFilter === "all" ? true :
      new Date(message.created_at).getFullYear().toString() === yearFilter;

    return matchesSearch && matchesTab && matchesYear;
  });

  // Stats
  const totalMessages = messages.length;
  const publishedMessages = messages.filter(m => m.is_published).length;
  const draftMessages = messages.filter(m => !m.is_published).length;
  const showingCount = filteredMessages.length;

  const activeFiltersCount = [
    searchQuery !== "",
    activeTab !== "all",
    yearFilter !== "all"
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="font-display text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Manage Messages
            </h1>
            <p className="text-muted-foreground">Create, edit, and manage sermon messages and teachings</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} size="lg" className="gap-2 shadow-lg">
                <Plus className="h-5 w-5" />
                Add Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedMessage ? "Edit Message" : "Create New Message"}
                </DialogTitle>
              </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Message Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Faith: The Story of a God and His People"
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Message Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  placeholder="Enter the message description or transcript..."
                  required
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="author_name">Speaker/Author *</Label>
                  <Input
                    id="author_name"
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    placeholder="e.g., Pastor John Smith"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be used for Speaker filtering on the Messages page
                  </p>
                </div>

                <div>
                  <Label htmlFor="author_role">Scripture/Topic</Label>
                  <Input
                    id="author_role"
                    value={formData.author_role}
                    onChange={(e) => setFormData({ ...formData, author_role: e.target.value })}
                    placeholder="e.g., Genesis 1:1, Romans 8:28, or Faith Series"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter Bible references (Genesis-Revelation) for Scripture filtering, or topics (e.g., "Faith", "Hope", "Advent Series") for Topic filtering
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="image">Featured Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                        setFormData({ ...formData, image_url: "" });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published" className="cursor-pointer">
                  Publish immediately
                </Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedMessage ? "Update Message" : "Create Message"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalMessages}</div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-green-600" />
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{publishedMessages}</div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileClock className="h-4 w-4 text-yellow-600" />
                Drafts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{draftMessages}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                Showing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{showingCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 w-full md:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages by title, content, or speaker..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 items-center flex-wrap">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Reset ({activeFiltersCount})
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedMessageIds.length > 0 && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 justify-between flex-wrap">
                <span className="text-sm font-medium">
                  {selectedMessageIds.length} message(s) selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkPublish(true)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Publish
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkPublish(false)}
                    className="gap-2"
                  >
                    <EyeOff className="h-4 w-4" />
                    Unpublish
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMessageIds([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs and Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3 mb-6">
            <TabsTrigger value="all" className="gap-2">
              <BookOpen className="h-4 w-4" />
              All Messages
            </TabsTrigger>
            <TabsTrigger value="published" className="gap-2">
              <FileCheck className="h-4 w-4" />
              Published
            </TabsTrigger>
            <TabsTrigger value="drafts" className="gap-2">
              <FileClock className="h-4 w-4" />
              Drafts
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                  <p className="text-muted-foreground">Loading messages...</p>
                </CardContent>
              </Card>
            ) : filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  {searchQuery || yearFilter !== "all" ? (
                    <>
                      <p className="text-muted-foreground mb-2">No messages found matching your filters.</p>
                      <Button variant="outline" onClick={handleResetFilters}>
                        Clear Filters
                      </Button>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No messages found. Create your first message!</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <Checkbox
                    checked={selectedMessageIds.length === filteredMessages.length && filteredMessages.length > 0}
                    onCheckedChange={toggleSelectAll}
                    id="select-all"
                  />
                  <Label htmlFor="select-all" className="cursor-pointer text-sm font-medium">
                    Select all ({filteredMessages.length})
                  </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMessages.map((message) => (
                    <Card key={message.id} className={`group hover:shadow-xl transition-all overflow-hidden ${!message.is_published ? 'border-dashed border-2 border-yellow-500/50' : 'border-primary/10'}`}>
                      <div className="relative">
                        {message.image_url ? (
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={message.image_url}
                              alt={message.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute top-3 right-3">
                              <Checkbox
                                checked={selectedMessageIds.includes(message.id)}
                                onCheckedChange={() => toggleMessageSelection(message.id)}
                                className="bg-white"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                            <BookOpen className="h-16 w-16 text-primary/30" />
                            <div className="absolute top-3 right-3">
                              <Checkbox
                                checked={selectedMessageIds.includes(message.id)}
                                onCheckedChange={() => toggleMessageSelection(message.id)}
                              />
                            </div>
                          </div>
                        )}
                        {!message.is_published && (
                          <Badge className="absolute top-3 left-3 bg-yellow-500">Draft</Badge>
                        )}
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
                          {message.title}
                        </h3>
                        
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{message.author_name}</span>
                          </div>
                          {message.author_role && (
                            <div className="flex items-center gap-2">
                              <BookMarked className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{message.author_role}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>{format(new Date(message.created_at), "MMM dd, yyyy")}</span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
                          {message.content}
                        </p>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePublish(message)}
                            title={message.is_published ? "Unpublish" : "Publish"}
                            className="flex-1"
                          >
                            {message.is_published ? (
                              <><Eye className="h-4 w-4 mr-1" /> Published</>
                            ) : (
                              <><EyeOff className="h-4 w-4 mr-1" /> Draft</>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(message)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMessageToDelete(message);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{messageToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMessageToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Messages</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedMessageIds.length} message(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTestimonies;
