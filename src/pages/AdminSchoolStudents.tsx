import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, Phone, User, Calendar } from "lucide-react";
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
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Students</h1>
            <p className="text-muted-foreground">Manage church school students</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
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

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={student.photo_url || undefined} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{student.full_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">
                          <Calendar className="h-3 w-3 mr-1" />
                          {calculateAge(student.date_of_birth)} years old
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Guardian</p>
                    <p className="text-sm text-muted-foreground">{student.guardian_name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{student.guardian_phone}</span>
                  </div>
                  {student.notes && (
                    <div>
                      <p className="text-sm font-medium">Notes</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{student.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredStudents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No students found
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
