import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Student {
  id: string;
  full_name: string;
  photo_url: string | null;
}

interface AttendanceRecord {
  student_id: string;
  status: string;
}

export default function TakeAttendance() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [classId, selectedDate]);

  const fetchData = async () => {
    try {
      // Fetch class info
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("class_name")
        .eq("id", classId)
        .single();

      if (classError) throw classError;
      setClassName(classData.class_name);

      // Fetch students assigned to this class
      const { data: studentData, error: studentError } = await supabase
        .from("student_classes")
        .select("student_id, students(id, full_name, photo_url)")
        .eq("class_id", classId);

      if (studentError) throw studentError;

      const studentList = studentData
        .map(sc => sc.students)
        .filter(s => s !== null) as Student[];
      
      setStudents(studentList);

      // Fetch existing attendance for this date
      const { data: attendanceData } = await supabase
        .from("attendance_records")
        .select("student_id, status")
        .eq("class_id", classId)
        .eq("date", selectedDate);

      const attendanceMap: Record<string, string> = {};
      attendanceData?.forEach((record: AttendanceRecord) => {
        attendanceMap[record.student_id] = record.status;
      });
      setAttendance(attendanceMap);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAllPresent = () => {
    const allPresent: Record<string, string> = {};
    students.forEach(student => {
      allPresent[student.id] = "Present";
    });
    setAttendance(allPresent);
    toast.success("All students marked as present");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Delete existing attendance for this date
      await supabase
        .from("attendance_records")
        .delete()
        .eq("class_id", classId)
        .eq("date", selectedDate);

      // Insert new attendance records
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        class_id: classId,
        date: selectedDate,
        status,
        taken_by: user?.id || null
      }));

      const { error } = await supabase
        .from("attendance_records")
        .insert(records);

      if (error) throw error;

      toast.success("Attendance saved successfully");
      navigate("/admin/school/classes");
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-center">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-5xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/school/classes")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Take Attendance</h1>
            <p className="text-muted-foreground">{className}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Attendance Record</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="date">Date:</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleMarkAllPresent}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Mark All Present
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No students assigned to this class
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-4 font-medium">Student</th>
                        <th className="text-left p-4 font-medium w-48">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={student.photo_url || undefined} />
                                <AvatarFallback>
                                  {student.full_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{student.full_name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Select
                              value={attendance[student.id] || ""}
                              onValueChange={(value) => handleStatusChange(student.id, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Present">Present</SelectItem>
                                <SelectItem value="Absent">Absent</SelectItem>
                                <SelectItem value="Late">Late</SelectItem>
                                <SelectItem value="Excused">Excused</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => navigate("/admin/school/classes")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving || Object.keys(attendance).length === 0}>
                    {saving ? "Saving..." : "Save Attendance"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
