import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Edit2, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
}

const AdminBlog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    author: "",
    category: "Announcements",
  });

  useEffect(() => {
    checkAdminStatus();
    loadPosts();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (!data?.some(r => r.role === "admin")) {
      navigate("/");
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    // For now, use mock data. Replace with Supabase query when table is ready
    setPosts([
      {
        id: "1",
        title: "Welcome to Chin Bethel Church Blog",
        excerpt: "Discover the latest news, updates, and reflections from our church community.",
        content: "Full content here...",
        author: "CBC Team",
        date: "November 15, 2025",
        category: "Announcements",
      },
    ]);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    if (editingId) {
      // Update existing post
      setPosts(posts.map(p => p.id === editingId ? { ...formData, id: editingId, date: p.date } : p));
      toast({
        title: "Success",
        description: "Blog post updated successfully",
      });
    } else {
      // Create new post
      const newPost: BlogPost = {
        id: Date.now().toString(),
        ...formData,
        date: new Date().toLocaleDateString(),
      };
      setPosts([newPost, ...posts]);
      toast({
        title: "Success",
        description: "Blog post created successfully",
      });
    }

    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (post: BlogPost) => {
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      category: post.category,
    });
    setEditingId(post.id);
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    setPosts(posts.filter(p => p.id !== id));
    toast({
      title: "Success",
      description: "Blog post deleted successfully",
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      author: "",
      category: "Announcements",
    });
    setEditingId(null);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manage Blog Posts</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="gap-2">
                <Plus className="w-4 h-4" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Post title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Excerpt</label>
                  <Input
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Short summary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Full post content"
                    className="w-full min-h-32 p-2 border border-input rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Author</label>
                  <Input
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Author name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-input rounded-md"
                  >
                    <option>Announcements</option>
                    <option>Reflections</option>
                    <option>Events</option>
                    <option>News</option>
                  </select>
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editingId ? "Update Post" : "Create Post"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle>{post.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge>{post.category}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {post.date}
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {post.author}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(post)}
                        className="gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(post.id)}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2">{post.excerpt}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No blog posts yet. Create your first post!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBlog;
