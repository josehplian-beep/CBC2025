import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  ClipboardList, 
  Award, 
  FolderOpen, 
  Users, 
  UserCircle, 
  LogOut,
  Loader2,
  Mail,
  Phone
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Teacher {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  bio: string | null;
}

interface Class {
  id: string;
  class_name: string;
  description: string | null;
}

interface Student {
  id: string;
  full_name: string;
  date_of_birth: string;
  photo_url: string | null;
}

export default function TeacherProfileEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    photo_url: "",
    bio: "",
  });

  useEffect(() => {
    if (id) {
      fetchTeacherData();
    }
  }, [id]);

  const fetchTeacherData = async () => {
    try {
      // Fetch teacher data
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", id)
        .single();

      if (teacherError) throw teacherError;

      setTeacher(teacherData);
      setFormData({
        full_name: teacherData.full_name,
        email: teacherData.email || "",
        phone: teacherData.phone || "",
        photo_url: teacherData.photo_url || "",
        bio: teacherData.bio || "",
      });

      // Fetch classes taught by this teacher
      const { data: classesData } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", id)
        .order("class_name");

      if (classesData) setClasses(classesData);

      // Fetch students from those classes
      if (classesData && classesData.length > 0) {
        const classIds = classesData.map(c => c.id);
        const { data: studentClassData } = await supabase
          .from("student_classes")
          .select("student_id, students(*)")
          .in("class_id", classIds);

        if (studentClassData) {
          const uniqueStudents = Array.from(
            new Map(studentClassData.map(sc => [sc.students.id, sc.students])).values()
          );
          setStudents(uniqueStudents as Student[]);
        }
      }
    } catch (error: any) {
      console.error("Error fetching teacher data:", error);
      toast.error("Failed to load teacher profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("teachers")
        .update(formData)
        .eq("id", id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      fetchTeacherData();
    } catch (error: any) {
      toast.error("Error updating profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-accent to-primary/80">
        <Loader2 className="w-8 h-8 animate-spin text-card-foreground" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-accent to-primary/80">
        <Card className="p-8 bg-card/95">
          <p className="text-lg">Teacher not found</p>
          <Button onClick={() => navigate("/admin/school/teachers")} className="mt-4">
            Back to Teachers
          </Button>
        </Card>
      </div>
    );
  }

  const sidebarItems = [
    { id: "profile", icon: UserCircle, label: "Teacher Profile" },
    { id: "attendance", icon: ClipboardList, label: "Attendance Record" },
    { id: "certificate", icon: Award, label: "Certificate" },
    { id: "files", icon: FolderOpen, label: "File Records" },
    { id: "directory", icon: Users, label: "Directory" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-accent to-primary/80">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-primary/90 text-primary-foreground flex flex-col backdrop-blur-sm">
          <div className="p-6 border-b border-border/20">
            <h2 className="text-xl font-bold">{teacher.full_name}</h2>
            <p className="text-muted-foreground text-sm">Church School Teacher</p>
          </div>

          <div className="flex-1 py-4">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                  activeTab === item.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/20"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            className="m-4 justify-start"
            onClick={() => navigate("/admin/school/teachers")}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Back to Teachers
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            <Card className="bg-card/95 backdrop-blur-sm p-8 shadow-xl">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="hidden">
                  {sidebarItems.map((item) => (
                    <TabsTrigger key={item.id} value={item.id} />
                  ))}
                </TabsList>

                <TabsContent value="profile">
                  <div className="space-y-6">
                    <div className="flex justify-center mb-6">
                      <Avatar className="w-32 h-32 border-4 border-accent/20">
                        <AvatarImage src={teacher.photo_url || ""} />
                        <AvatarFallback className="text-3xl bg-accent/10 text-accent">
                          {teacher.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-bold flex items-center gap-2">
                          <UserCircle className="h-4 w-4" />
                          FULL NAME *
                        </Label>
                        <Input
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="mt-1 h-12"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-bold flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          EMAIL
                        </Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="mt-1 h-12"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-bold flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          PHONE
                        </Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="mt-1 h-12"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-bold">PHOTO URL</Label>
                        <Input
                          value={formData.photo_url}
                          onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                          className="mt-1 h-12"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-bold">BIO</Label>
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="mt-1"
                        rows={4}
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div className="pt-4">
                      <Label className="text-sm font-bold mb-3 block">MY CLASSES</Label>
                      {classes.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No classes assigned yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {classes.map((cls) => (
                            <Card key={cls.id} className="p-4 bg-muted/50">
                              <h4 className="font-semibold">{cls.class_name}</h4>
                              {cls.description && (
                                <p className="text-sm text-muted-foreground mt-1">{cls.description}</p>
                              )}
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4">
                      <Label className="text-sm font-bold mb-3 block">MY STUDENTS ({students.length})</Label>
                      {students.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No students assigned yet.</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {students.slice(0, 6).map((student) => (
                            <Card key={student.id} className="p-3 bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={student.photo_url || ""} />
                                  <AvatarFallback className="text-xs">
                                    {student.full_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-sm font-medium truncate">{student.full_name}</p>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full h-12 bg-accent hover:bg-accent/90"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save Changes
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="attendance">
                  <div className="text-center py-12">
                    <ClipboardList className="w-16 h-16 mx-auto text-accent mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Attendance Management</h3>
                    <p className="text-muted-foreground">Attendance tracking coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="certificate">
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 mx-auto text-accent mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Certificates</h3>
                    <p className="text-muted-foreground">Certificate management coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="files">
                  <div className="text-center py-12">
                    <FolderOpen className="w-16 h-16 mx-auto text-accent mb-4" />
                    <h3 className="text-2xl font-bold mb-2">File Records</h3>
                    <p className="text-muted-foreground">File management coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="directory">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold mb-4">My Students Directory</h3>
                    {students.length === 0 ? (
                      <p className="text-muted-foreground">No students assigned yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {students.map((student) => (
                          <Card key={student.id} className="p-4 bg-muted/50">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={student.photo_url || ""} />
                                <AvatarFallback>{student.full_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{student.full_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Age: {new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()} years
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
