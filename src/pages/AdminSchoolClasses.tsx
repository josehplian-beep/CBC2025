import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, Users, BookOpen, Pencil, ClipboardList } from "lucide-react";

interface Class {
  id: string;
  class_name: string;
  description: string | null;
  teacher_id: string | null;
  teachers: {
    full_name: string;
  } | null;
}

interface Teacher {
  id: string;
  full_name: string;
}

export default function AdminSchoolClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    class_name: "",
    description: "",
    teacher_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, teachersRes] = await Promise.all([
        supabase
          .from("classes")
          .select("*, teachers(full_name)")
          .order("class_name"),
        supabase
          .from("teachers")
          .select("id, full_name")
          .order("full_name")
      ]);

      if (classesRes.error) throw classesRes.error;
      if (teachersRes.error) throw teachersRes.error;

      setClasses(classesRes.data || []);
      setTeachers(teachersRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("classes")
        .insert([{
          ...formData,
          teacher_id: formData.teacher_id || null
        }]);

      if (error) throw error;

      toast.success("Class added successfully");
      setOpen(false);
      setFormData({ class_name: "", description: "", teacher_id: "" });
      fetchData();
    } catch (error) {
      console.error("Error adding class:", error);
      toast.error("Failed to add class");
    }
  };

  const filteredClasses = classes.filter(cls =>
    cls.class_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-background">
      <div className="bg-gradient-to-r from-primary via-accent to-primary p-8 mb-6 rounded-b-2xl shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-bold text-primary-foreground">Classes</h1>
            <p className="text-primary-foreground/80 text-lg">Manage church school classes and curriculum</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg">
                <Plus className="mr-2 h-5 w-5" />
                Add Class
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
              <DialogDescription>Enter class information below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class_name">Class Name *</Label>
                <Input
                  id="class_name"
                  required
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher_id">Assign Teacher</Label>
                <Select
                  value={formData.teacher_id}
                  onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full">Add Class</Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
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
            {filteredClasses.map((cls) => (
              <Card key={cls.id} className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/30 rounded-2xl overflow-hidden bg-gradient-to-br from-card via-card to-secondary/20">
                <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <BookOpen className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-display group-hover:text-primary transition-colors">{cls.class_name}</CardTitle>
                      {cls.description && (
                        <CardDescription className="line-clamp-2 mt-2 text-base">
                          {cls.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cls.teachers && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <Users className="h-5 w-5 text-accent" />
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Teacher</span>
                        <p className="font-semibold">{cls.teachers.full_name}</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 pt-2">
                    <Button 
                      variant="outline"
                      className="w-full h-11 rounded-xl border-2 hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all"
                      onClick={() => navigate(`/admin/school/classes/${cls.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Class
                    </Button>
                    <Button 
                      className="w-full h-11 rounded-xl shadow-md hover:shadow-lg bg-gradient-to-r from-primary to-accent"
                      onClick={() => navigate(`/admin/school/classes/${cls.id}/attendance`)}
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Take Attendance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredClasses.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-xl text-muted-foreground">No classes found</p>
          </div>
        )}
      </div>
    </div>
  );
}
