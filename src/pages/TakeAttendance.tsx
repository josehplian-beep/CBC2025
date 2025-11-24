import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: string;
  full_name: string;
  photo_url: string | null;
}

interface AttendanceStatus {
  student_id: string;
  status: "Present" | "Absent" | "Late" | "Excused";
  notes: string;
}

export default function TakeAttendance() {
  const { classId } = useParams();
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (classId) {
      fetchClassData();
    }
  }, [classId]);

  const fetchClassData = async () => {
    try {
      // Fetch class details
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("class_name")
        .eq("id", classId)
        .single();

      if (classError) throw classError;
      setClassName(classData.class_name);

      // Fetch students in this class
      const { data: studentClassData, error: studentError } = await supabase
        .from("student_classes")
        .select("students(id, full_name, photo_url)")
        .eq("class_id", classId);

      if (studentError) throw studentError;

      const studentList = studentClassData
        .map(sc => sc.students)
        .filter((s): s is Student => s !== null);

      setStudents(studentList);

      // Initialize attendance
      const initialAttendance: Record<string, AttendanceStatus> = {};
      studentList.forEach(student => {
        initialAttendance[student.id] = {
          student_id: student.id,
          status: "Present",
          notes: ""
        };
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error("Error fetching class data:", error);
      toast.error("Failed to load class data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus["status"]) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  const handleMarkAllPresent = () => {
    const updatedAttendance: Record<string, AttendanceStatus> = {};
    students.forEach(student => {
      updatedAttendance[student.id] = {
        student_id: student.id,
        status: "Present",
        notes: attendance[student.id]?.notes || ""
      };
    });
    setAttendance(updatedAttendance);
    toast.success("Marked all students as present");
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const records = Object.values(attendance).map(record => ({
        student_id: record.student_id,
        class_id: classId,
        date: selectedDate,
        status: record.status,
        notes: record.notes || null,
        taken_by: null // You can get the current teacher ID from auth context
      }));

      const { error } = await supabase
        .from("attendance_records")
        .upsert(records, {
          onConflict: "student_id,class_id,date"
        });

      if (error) throw error;

      toast.success("Attendance saved successfully");
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: AttendanceStatus["status"]) => {
    switch (status) {
      case "Present":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "Absent":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "Late":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "Excused":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: AttendanceStatus["status"]) => {
    switch (status) {
      case "Present":
        return "bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20";
      case "Absent":
        return "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20";
      case "Late":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20";
      case "Excused":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20";
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <p>Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{className}</h1>
          <p className="text-muted-foreground">Take attendance for class</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Attendance Sheet</CardTitle>
                <CardDescription>Mark attendance for {selectedDate}</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <Button variant="outline" onClick={handleMarkAllPresent}>
                  Mark All Present
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {students.map((student) => (
              <Card key={student.id} className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={student.photo_url || undefined} />
                    <AvatarFallback>{student.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{student.full_name}</h3>
                      <div className="flex gap-2">
                        {(["Present", "Absent", "Late", "Excused"] as const).map((status) => (
                          <Button
                            key={status}
                            variant={attendance[student.id]?.status === status ? "default" : "outline"}
                            size="sm"
                            className={attendance[student.id]?.status === status ? getStatusColor(status) : ""}
                            onClick={() => handleStatusChange(student.id, status)}
                          >
                            {getStatusIcon(status)}
                            <span className="ml-2">{status}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Textarea
                      placeholder="Add notes (optional)"
                      value={attendance[student.id]?.notes || ""}
                      onChange={(e) => handleNotesChange(student.id, e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Submit Attendance"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
