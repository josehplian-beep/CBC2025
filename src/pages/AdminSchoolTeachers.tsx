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
    <div className="min-h-screen bg-gradient-to-br from-primary via-accent to-primary/80 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/95 backdrop-blur-sm p-6 rounded-lg shadow-lg">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Teachers Management</h1>
            <p className="text-muted-foreground mt-1">Manage church school teachers and their profiles</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-accent hover:bg-accent/90">
                <Plus className="mr-2 h-5 w-5" />
                Add New Teacher
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

        {/* Search */}
        <Card className="bg-card/95 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search teachers by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Teachers Grid */}
        {loading ? (
          <Card className="bg-card/95 backdrop-blur-sm">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">Loading teachers...</div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher) => (
              <Card key={teacher.id} className="bg-card/95 backdrop-blur-sm hover:shadow-xl transition-all hover:scale-105 border-2 hover:border-accent">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20 border-4 border-accent/20">
                      <AvatarImage src={teacher.photo_url || undefined} />
                      <AvatarFallback className="bg-accent text-accent-foreground text-xl">
                        {teacher.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl truncate">{teacher.full_name}</CardTitle>
                      <p className="text-sm text-accent font-medium mt-1">Church Teacher</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {teacher.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {teacher.bio}
                    </p>
                  )}
                  {teacher.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-accent" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                  )}
                  {teacher.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-accent" />
                      <span>{teacher.phone}</span>
                    </div>
                  )}
                  <div className="pt-3 flex gap-2">
                    <Button 
                      variant="default"
                      size="sm" 
                      className="flex-1 bg-accent hover:bg-accent/90"
                      onClick={() => navigate(`/admin/school/teachers/${teacher.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/admin/school/teachers/${teacher.id}`)}
                    >
                      <User className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredTeachers.length === 0 && (
          <Card className="bg-card/95 backdrop-blur-sm">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">No teachers found</p>
                <p className="text-sm mt-1">Try adjusting your search or add a new teacher</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
