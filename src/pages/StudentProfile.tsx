import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  ClipboardList, 
  Award, 
  FolderOpen, 
  Users, 
  UserCircle, 
  LogOut,
  Loader2,
  Upload
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  classes: { class_name: string };
}

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    guardian_name: "",
    guardian_phone: "",
    notes: ""
  });

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const fetchStudentData = async () => {
    try {
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single();

      if (studentError) throw studentError;

      setStudent(studentData);
      setFormData({
        full_name: studentData.full_name,
        date_of_birth: studentData.date_of_birth,
        guardian_name: studentData.guardian_name,
        guardian_phone: studentData.guardian_phone,
        notes: studentData.notes || ""
      });

      // Fetch attendance records
      const { data: attendanceData } = await supabase
        .from("attendance_records")
        .select("*, classes(class_name)")
        .eq("student_id", id)
        .order("date", { ascending: false })
        .limit(10);

      if (attendanceData) setAttendance(attendanceData);
    } catch (error: any) {
      toast.error("Error loading student data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("students")
        .update(formData)
        .eq("id", id);

      if (error) throw error;

      toast.success("Student profile updated successfully");
      fetchStudentData();
    } catch (error: any) {
      toast.error("Error updating profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-700 via-teal-600 to-blue-700">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-700 via-teal-600 to-blue-700">
        <Card className="p-8 bg-white/95">
          <p className="text-lg">Student not found</p>
          <Button onClick={() => navigate("/admin/school/students")} className="mt-4">
            Back to Students
          </Button>
        </Card>
      </div>
    );
  }

  const sidebarItems = [
    { id: "attendance", icon: ClipboardList, label: "Attendance Record" },
    { id: "certificate", icon: Award, label: "Certificate" },
    { id: "files", icon: FolderOpen, label: "File Records" },
    { id: "directory", icon: Users, label: "Directory" },
    { id: "profile", icon: UserCircle, label: "CM Profile" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-600 to-blue-700">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-teal-800 text-white flex flex-col">
          <div className="p-6 border-b border-teal-700">
            <h2 className="text-xl font-bold">{student.full_name}</h2>
            <p className="text-teal-300 text-sm">Age: {calculateAge(student.date_of_birth)} years</p>
          </div>

          <div className="flex-1 py-4">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                  activeTab === item.id
                    ? "bg-teal-700 text-white"
                    : "text-teal-200 hover:bg-teal-700/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            className="m-4 justify-start text-white hover:bg-teal-700"
            onClick={() => navigate("/admin/school/students")}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Back to Students
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            <Card className="bg-amber-50/95 backdrop-blur-sm p-8 shadow-xl">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="hidden">
                  {sidebarItems.map((item) => (
                    <TabsTrigger key={item.id} value={item.id} />
                  ))}
                </TabsList>

                <TabsContent value="profile">
                  <div className="space-y-6">
                    <div className="flex justify-center mb-6">
                      <Avatar className="w-32 h-32 border-4 border-teal-600">
                        <AvatarImage src={student.photo_url || ""} />
                        <AvatarFallback className="text-3xl bg-teal-100 text-teal-700">
                          {student.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div>
                      <Label className="text-sm font-bold text-gray-800">FULL NAME*</Label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="mt-1 bg-amber-100/50 border-amber-300"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-bold text-gray-800">DATE OF BIRTH*</Label>
                      <Input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        className="mt-1 bg-amber-100/50 border-amber-300"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-bold text-gray-800">GUARDIAN NAME*</Label>
                      <Input
                        value={formData.guardian_name}
                        onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                        className="mt-1 bg-amber-100/50 border-amber-300"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-bold text-gray-800">GUARDIAN PHONE*</Label>
                      <Input
                        value={formData.guardian_phone}
                        onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                        className="mt-1 bg-amber-100/50 border-amber-300"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-bold text-gray-800">NOTES</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="mt-1 bg-amber-100/50 border-amber-300"
                        rows={4}
                      />
                    </div>

                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full bg-teal-600 hover:bg-teal-700"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save Changes
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="attendance">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Attendance Records</h3>
                    {attendance.length === 0 ? (
                      <p className="text-gray-600">No attendance records found.</p>
                    ) : (
                      <div className="space-y-3">
                        {attendance.map((record) => (
                          <Card key={record.id} className="p-4 bg-white/80">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold">{record.classes.class_name}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(record.date).toLocaleDateString()}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  record.status === "present"
                                    ? "bg-green-100 text-green-700"
                                    : record.status === "absent"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {record.status}
                              </span>
                            </div>
                            {record.notes && (
                              <p className="text-sm text-gray-600 mt-2">{record.notes}</p>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="certificate">
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 mx-auto text-teal-600 mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Certificates</h3>
                    <p className="text-gray-600">Certificate management coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="files">
                  <div className="text-center py-12">
                    <FolderOpen className="w-16 h-16 mx-auto text-teal-600 mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">File Records</h3>
                    <p className="text-gray-600">File management coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="directory">
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-teal-600 mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Directory</h3>
                    <p className="text-gray-600">Student directory coming soon</p>
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
