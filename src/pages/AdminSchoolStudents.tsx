import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, Loader2, Users, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [classes, setClasses] = useState<Array<{ id: string; class_name: string }>>([]);
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
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id, class_name")
      .order("class_name");
    if (data) setClasses(data);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-600 to-blue-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-700 text-white py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">C.M STUDENT DIRECTORY</h1>
          <p className="text-teal-100 text-lg">Children Ministry Student Management System</p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="mt-6 bg-amber-400 hover:bg-amber-500 text-teal-900 font-semibold px-6 py-2 rounded-full shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                ADD NEW STUDENT
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-amber-50/95">
              <DialogHeader>
                <DialogTitle className="text-2xl">Add New Student</DialogTitle>
                <DialogDescription>Enter student information below</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="bg-white/80"
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
                    className="bg-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo_url">Photo URL</Label>
                  <Input
                    id="photo_url"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                    className="bg-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian_name">Guardian Name *</Label>
                  <Input
                    id="guardian_name"
                    required
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    className="bg-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian_phone">Guardian Phone *</Label>
                  <Input
                    id="guardian_phone"
                    required
                    value={formData.guardian_phone}
                    onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                    className="bg-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="bg-white/80"
                  />
                </div>
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">Add Student</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex gap-6">
          {/* Class Filter Sidebar */}
          <Card className="w-80 h-fit bg-amber-50/95 backdrop-blur-sm shadow-xl border-0">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-teal-600">
                C.M CLASSES
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedClass(null)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    !selectedClass
                      ? "bg-teal-600 text-white shadow-md"
                      : "bg-white/50 text-gray-700 hover:bg-teal-50"
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">All Students</span>
                </button>
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                      selectedClass === cls.id
                        ? "bg-teal-600 text-white shadow-md"
                        : "bg-white/50 text-gray-700 hover:bg-teal-50"
                    }`}
                  >
                    <UserCircle className="w-5 h-5" />
                    <span className="font-medium">{cls.class_name}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Student List */}
          <div className="flex-1">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search students by name or guardian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-white/95 backdrop-blur-sm shadow-lg border-0 text-lg"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-white" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <Users className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No students found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <Card
                    key={student.id}
                    className="bg-amber-50/95 backdrop-blur-sm hover:shadow-xl transition-all duration-200 border-0"
                  >
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16 border-2 border-teal-600">
                          <AvatarImage src={student.photo_url || ""} />
                          <AvatarFallback className="bg-teal-100 text-teal-700 text-xl font-semibold">
                            {student.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {student.full_name}
                          </h3>
                          <p className="text-gray-600">
                            Guardian: {student.guardian_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right mr-4">
                          <p className="text-sm text-gray-500">Age</p>
                          <p className="text-2xl font-bold text-teal-700">
                            {calculateAge(student.date_of_birth)}y
                          </p>
                        </div>
                        <Button
                          onClick={() => navigate(`/student-profile/${student.id}`)}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full"
                        >
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
