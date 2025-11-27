import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  LogOut,
  Loader2
} from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-accent to-primary/80">
        <Loader2 className="w-8 h-8 animate-spin text-card-foreground" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-accent to-primary/80">
        <Card className="p-8 bg-card/95">
          <p className="text-lg">Student not found</p>
          <Button onClick={() => navigate("/admin/school/students")} className="mt-4">
            Back to Students
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-accent to-primary/80 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-card/95 backdrop-blur-sm p-6 rounded-lg shadow-lg">
          <div>
            <h1 className="text-3xl font-bold">Student Profile</h1>
            <p className="text-muted-foreground mt-1">{student.full_name}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/school/students")}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Back to Students
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex justify-center mb-6">
                <Avatar className="w-32 h-32 border-4 border-accent/20">
                  <AvatarImage src={student.photo_url || ""} />
                  <AvatarFallback className="text-3xl bg-accent/10 text-accent">
                    {student.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-bold">FULL NAME *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="mt-1 h-12"
                  />
                </div>

                <div>
                  <Label className="text-sm font-bold">DATE OF BIRTH *</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="mt-1 h-12"
                  />
                </div>

                <div>
                  <Label className="text-sm font-bold">GUARDIAN NAME *</Label>
                  <Input
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    className="mt-1 h-12"
                  />
                </div>

                <div>
                  <Label className="text-sm font-bold">GUARDIAN PHONE *</Label>
                  <Input
                    value={formData.guardian_phone}
                    onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                    className="mt-1 h-12"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-bold">NOTES</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div className="pt-4">
                <Label className="text-sm font-bold mb-3 block">RECENT ATTENDANCE</Label>
                {attendance.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No attendance records found.</p>
                ) : (
                  <div className="space-y-2">
                    {attendance.slice(0, 5).map((record) => (
                      <div key={record.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{record.classes.class_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.date).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            record.status === "present"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : record.status === "absent"
                              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
