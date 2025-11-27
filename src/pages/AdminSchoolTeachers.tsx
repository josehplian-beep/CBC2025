import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, Mail, Phone, User, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Teacher {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  bio: string | null;
}

export default function AdminSchoolTeachers() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    photo_url: "",
    bio: "",
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("full_name");

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("teachers")
        .insert([formData]);

      if (error) throw error;

      toast.success("Teacher added successfully");
      setOpen(false);
      setFormData({ full_name: "", email: "", phone: "", photo_url: "", bio: "" });
      fetchTeachers();
    } catch (error) {
      console.error("Error adding teacher:", error);
      toast.error("Failed to add teacher");
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-background">
      <div className="bg-gradient-to-r from-primary via-accent to-primary p-8 mb-6 rounded-b-2xl shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-bold text-primary-foreground">Teachers</h1>
            <p className="text-primary-foreground/80 text-lg">Manage church school teaching staff</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg">
                <Plus className="mr-2 h-5 w-5" />
                Add Teacher
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
              <DialogDescription>Enter teacher information below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo_url">Photo URL</Label>
                  <Input
                    id="photo_url"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full">Add Teacher</Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 text-lg rounded-xl border-2 shadow-md focus:shadow-lg transition-all"
          />
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher) => (
              <Card key={teacher.id} className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/30 rounded-2xl overflow-hidden bg-gradient-to-br from-card via-card to-secondary/20">
                <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20 border-4 border-primary/20 shadow-lg group-hover:scale-105 transition-transform">
                      <AvatarImage src={teacher.photo_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl">
                        <User className="h-10 w-10" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-display group-hover:text-primary transition-colors">{teacher.full_name}</CardTitle>
                      {teacher.bio && (
                        <CardDescription className="line-clamp-2 mt-2 text-base">
                          {teacher.bio}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {teacher.email && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <Mail className="h-5 w-5 text-accent flex-shrink-0" />
                        <span className="truncate text-sm font-medium">{teacher.email}</span>
                      </div>
                    )}
                    {teacher.phone && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <Phone className="h-5 w-5 text-accent flex-shrink-0" />
                        <span className="text-sm font-medium">{teacher.phone}</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full h-11 rounded-xl border-2 hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all"
                    onClick={() => navigate(`/admin/school/teachers/${teacher.id}/edit`)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Teacher
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredTeachers.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-xl text-muted-foreground">No teachers found</p>
          </div>
        )}
      </div>
    </div>
  );
}
