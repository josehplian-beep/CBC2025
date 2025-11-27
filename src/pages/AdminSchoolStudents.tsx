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
import { Plus, Search, Phone, User, Calendar, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: string;
  full_name: string;
  date_of_birth: string;
  photo_url: string | null;
  guardian_name: string;
  guardian_phone: string;
  notes: string | null;
}

export default function AdminSchoolStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    photo_url: "",
    guardian_name: "",
    guardian_phone: "",
    notes: "",
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("full_name");

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("students")
        .insert([formData]);

      if (error) throw error;

      toast.success("Student added successfully");
      setOpen(false);
      setFormData({ full_name: "", date_of_birth: "", photo_url: "", guardian_name: "", guardian_phone: "", notes: "" });
      fetchStudents();
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error("Failed to add student");
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.guardian_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-background">
      <div className="bg-gradient-to-r from-primary via-accent to-primary p-8 mb-6 rounded-b-2xl shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-bold text-primary-foreground">Students</h1>
            <p className="text-primary-foreground/80 text-lg">Manage church school student enrollment</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg">
                <Plus className="mr-2 h-5 w-5" />
                Add Student
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>Enter student information below</DialogDescription>
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
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo_url">Photo URL</Label>
                <Input
                  id="photo_url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guardian_name">Guardian Name *</Label>
                  <Input
                    id="guardian_name"
                    required
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian_phone">Guardian Phone *</Label>
                  <Input
                    id="guardian_phone"
                    required
                    value={formData.guardian_phone}
                    onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">Add Student</Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search students..."
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
            {filteredStudents.map((student) => (
              <Card key={student.id} className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/30 rounded-2xl overflow-hidden bg-gradient-to-br from-card via-card to-secondary/20">
                <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20 border-4 border-primary/20 shadow-lg group-hover:scale-105 transition-transform">
                      <AvatarImage src={student.photo_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl">
                        <User className="h-10 w-10" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-display group-hover:text-primary transition-colors">{student.full_name}</CardTitle>
                      <Badge className="mt-2 bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">
                        <Calendar className="h-3 w-3 mr-1" />
                        {calculateAge(student.date_of_birth)} years old
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Guardian</p>
                    <p className="font-semibold">{student.guardian_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Phone className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium">{student.guardian_phone}</span>
                    </div>
                  </div>
                  {student.notes && (
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm line-clamp-2">{student.notes}</p>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full h-11 rounded-xl border-2 hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all"
                    onClick={() => navigate(`/admin/school/students/${student.id}/edit`)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Student
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredStudents.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-xl text-muted-foreground">No students found</p>
          </div>
        )}
      </div>
    </div>
  );
}
