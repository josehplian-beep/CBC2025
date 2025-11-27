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
    <div className="min-h-screen bg-gradient-to-br from-primary via-accent to-primary/80 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/95 backdrop-blur-sm p-6 rounded-lg shadow-lg">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Classes Management</h1>
            <p className="text-muted-foreground mt-1">Manage church school classes and assignments</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-accent hover:bg-accent/90">
                <Plus className="mr-2 h-5 w-5" />
                Add New Class
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

        {/* Search */}
        <Card className="bg-card/95 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Classes Grid */}
        {loading ? (
          <Card className="bg-card/95 backdrop-blur-sm">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">Loading classes...</div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((cls) => (
              <Card key={cls.id} className="bg-card/95 backdrop-blur-sm hover:shadow-xl transition-all hover:scale-105 border-2 hover:border-accent">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-xl bg-accent/10 flex items-center justify-center border-2 border-accent/20">
                      <BookOpen className="h-8 w-8 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl">{cls.class_name}</CardTitle>
                      {cls.description && (
                        <CardDescription className="line-clamp-2 mt-2">
                          {cls.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cls.teachers && (
                    <div className="flex items-center gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                      <Users className="h-4 w-4 text-accent" />
                      <span className="font-medium">Teacher:</span>
                      <span className="text-muted-foreground">{cls.teachers.full_name}</span>
                    </div>
                  )}
                  <div className="space-y-2 pt-2">
                    <Button 
                      variant="outline"
                      className="w-full border-2 hover:border-accent hover:bg-accent/5"
                      onClick={() => navigate(`/admin/school/classes/${cls.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Class
                    </Button>
                    <Button 
                      className="w-full bg-accent hover:bg-accent/90"
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
          <Card className="bg-card/95 backdrop-blur-sm">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">No classes found</p>
                <p className="text-sm mt-1">Try adjusting your search or add a new class</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
