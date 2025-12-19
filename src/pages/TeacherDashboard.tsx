/**
 * TeacherDashboard
 * 
 * A streamlined dashboard for teachers to:
 * - View only their assigned classes
 * - Take attendance with one-click "Mark All Present"
 * - See today's attendance status at a glance
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeacherData } from "@/hooks/useTeacherData";
import { usePermissions } from "@/hooks/usePermissions";
import { useNavigate } from "react-router-dom";
import {
  Users,
  GraduationCap,
  UserCheck,
  Clock,
  UserX,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Calendar,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  full_name: string;
  photo_url: string | null;
}

interface AttendanceStatus {
  student_id: string;
  status: "Present" | "Absent" | "Late" | "Excused";
}

interface ClassWithAttendance {
  id: string;
  class_name: string;
  description: string | null;
  studentCount: number;
  students: Student[];
  attendance: AttendanceStatus[];
  todayCompleted: boolean;
}

export default function TeacherDashboard() {
  const { teacher, classes, loading: teacherLoading, error } = useTeacherData();
  const { isAdministrator, isStaff } = usePermissions();
  const navigate = useNavigate();
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassWithAttendance[]>([]);
  const [loadingClass, setLoadingClass] = useState<string | null>(null);
  const [savingAttendance, setSavingAttendance] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Load class details with attendance status
  const loadClassDetails = useCallback(async () => {
    if (classes.length === 0) return;

    const enrichedClasses: ClassWithAttendance[] = [];

    for (const cls of classes) {
      // Fetch students in this class
      const { data: studentData } = await supabase
        .from("student_classes")
        .select("student_id, students(id, full_name, photo_url)")
        .eq("class_id", cls.id);

      const students = (studentData || [])
        .map((sc) => sc.students)
        .filter((s): s is Student => s !== null);

      // Fetch today's attendance
      const { data: attendanceData } = await supabase
        .from("attendance_records")
        .select("student_id, status")
        .eq("class_id", cls.id)
        .eq("date", today);

      const attendance = (attendanceData || []).map((a) => ({
        student_id: a.student_id,
        status: a.status as AttendanceStatus["status"],
      }));

      const todayCompleted = students.length > 0 && attendance.length === students.length;

      enrichedClasses.push({
        ...cls,
        students,
        attendance,
        todayCompleted,
      });
    }

    setClassData(enrichedClasses);
    
    // Auto-select first class if none selected
    if (!selectedClassId && enrichedClasses.length > 0) {
      setSelectedClassId(enrichedClasses[0].id);
    }
  }, [classes, today, selectedClassId]);

  useEffect(() => {
    loadClassDetails();
  }, [loadClassDetails]);

  // Mark all students as present with one click
  const handleMarkAllPresent = async (classId: string) => {
    setSavingAttendance(true);
    setLoadingClass(classId);

    try {
      const classInfo = classData.find((c) => c.id === classId);
      if (!classInfo) return;

      // Delete existing attendance for today
      await supabase
        .from("attendance_records")
        .delete()
        .eq("class_id", classId)
        .eq("date", today);

      // Insert all as present
      const records = classInfo.students.map((student) => ({
        student_id: student.id,
        class_id: classId,
        date: today,
        status: "Present",
        taken_by: null,
      }));

      const { error: insertError } = await supabase
        .from("attendance_records")
        .insert(records);

      if (insertError) throw insertError;

      toast.success(`All ${records.length} students marked as present!`);
      await loadClassDetails();
    } catch (err) {
      console.error("Error saving attendance:", err);
      toast.error("Failed to save attendance");
    } finally {
      setSavingAttendance(false);
      setLoadingClass(null);
    }
  };

  // Update individual student attendance
  const handleAttendanceChange = async (
    classId: string,
    studentId: string,
    status: AttendanceStatus["status"]
  ) => {
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("class_id", classId)
        .eq("student_id", studentId)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("attendance_records")
          .update({ status })
          .eq("id", existing.id);
      } else {
        await supabase.from("attendance_records").insert({
          class_id: classId,
          student_id: studentId,
          date: today,
          status,
          taken_by: null,
        });
      }

      // Update local state
      setClassData((prev) =>
        prev.map((cls) => {
          if (cls.id !== classId) return cls;

          const newAttendance = cls.attendance.filter(
            (a) => a.student_id !== studentId
          );
          newAttendance.push({ student_id: studentId, status });

          return {
            ...cls,
            attendance: newAttendance,
            todayCompleted: cls.students.length === newAttendance.length,
          };
        })
      );
    } catch (err) {
      console.error("Error updating attendance:", err);
      toast.error("Failed to update attendance");
    }
  };

  const selectedClass = classData.find((c) => c.id === selectedClassId);

  const getAttendanceStats = (cls: ClassWithAttendance) => {
    const present = cls.attendance.filter((a) => a.status === "Present").length;
    const late = cls.attendance.filter((a) => a.status === "Late").length;
    const absent = cls.attendance.filter((a) => a.status === "Absent").length;
    const excused = cls.attendance.filter((a) => a.status === "Excused").length;
    const unmarked = cls.students.length - cls.attendance.length;
    return { present, late, absent, excused, unmarked };
  };

  // If admin/staff, show link to full dashboard
  const canAccessFullDashboard = isAdministrator || isStaff;

  if (teacherLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load Dashboard</h2>
          <p className="text-muted-foreground text-center max-w-md mb-4">{error}</p>
          {canAccessFullDashboard && (
            <Button onClick={() => navigate("/admin/school/dashboard")}>
              Go to Admin Dashboard
            </Button>
          )}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {teacher && (
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={teacher.photo_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {teacher.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Welcome, {teacher?.full_name || "Teacher"}
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              {canAccessFullDashboard && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin/school/dashboard")}
                  className="gap-2"
                >
                  Full Dashboard
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {classes.length === 0 ? (
            <Card className="p-12 text-center">
              <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Classes Assigned</h2>
              <p className="text-muted-foreground">
                You don't have any classes assigned yet. Please contact an administrator.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Class List */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  My Classes
                </h2>
                {classData.map((cls) => {
                  const stats = getAttendanceStats(cls);
                  const isSelected = selectedClassId === cls.id;

                  return (
                    <Card
                      key={cls.id}
                      className={cn(
                        "p-4 cursor-pointer transition-all hover:shadow-md",
                        isSelected && "ring-2 ring-primary bg-primary/5"
                      )}
                      onClick={() => setSelectedClassId(cls.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {cls.class_name}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3" />
                            {cls.studentCount} students
                          </p>
                        </div>
                        {cls.todayCompleted ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Done
                          </Badge>
                        ) : stats.unmarked > 0 ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            {stats.unmarked} pending
                          </Badge>
                        ) : null}
                      </div>
                      {cls.attendance.length > 0 && (
                        <div className="flex gap-2 mt-3 text-xs">
                          <span className="text-green-600">
                            {stats.present} present
                          </span>
                          {stats.late > 0 && (
                            <span className="text-yellow-600">{stats.late} late</span>
                          )}
                          {stats.absent > 0 && (
                            <span className="text-red-600">{stats.absent} absent</span>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Attendance Panel */}
              <div className="lg:col-span-2">
                {selectedClass ? (
                  <Card className="h-full">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">
                            {selectedClass.class_name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Today's Attendance • {selectedClass.students.length} students
                          </p>
                        </div>
                        <Button
                          onClick={() => handleMarkAllPresent(selectedClass.id)}
                          disabled={savingAttendance || selectedClass.students.length === 0}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          {loadingClass === selectedClass.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                          Mark All Present
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {selectedClass.students.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No students enrolled in this class</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[calc(100vh-350px)]">
                          <div className="space-y-2">
                            {selectedClass.students.map((student) => {
                              const record = selectedClass.attendance.find(
                                (a) => a.student_id === student.id
                              );
                              const currentStatus = record?.status;

                              return (
                                <div
                                  key={student.id}
                                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={student.photo_url || undefined} />
                                      <AvatarFallback>
                                        {student.full_name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-foreground">
                                      {student.full_name}
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant={currentStatus === "Present" ? "default" : "outline"}
                                      className={cn(
                                        "h-9 px-3",
                                        currentStatus === "Present" &&
                                          "bg-green-600 hover:bg-green-700 text-white"
                                      )}
                                      onClick={() =>
                                        handleAttendanceChange(
                                          selectedClass.id,
                                          student.id,
                                          "Present"
                                        )
                                      }
                                    >
                                      <UserCheck className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={currentStatus === "Late" ? "default" : "outline"}
                                      className={cn(
                                        "h-9 px-3",
                                        currentStatus === "Late" &&
                                          "bg-yellow-500 hover:bg-yellow-600 text-white"
                                      )}
                                      onClick={() =>
                                        handleAttendanceChange(
                                          selectedClass.id,
                                          student.id,
                                          "Late"
                                        )
                                      }
                                    >
                                      <Clock className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={currentStatus === "Absent" ? "default" : "outline"}
                                      className={cn(
                                        "h-9 px-3",
                                        currentStatus === "Absent" &&
                                          "bg-red-600 hover:bg-red-700 text-white"
                                      )}
                                      onClick={() =>
                                        handleAttendanceChange(
                                          selectedClass.id,
                                          student.id,
                                          "Absent"
                                        )
                                      }
                                    >
                                      <UserX className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <div className="text-center p-12">
                      <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">
                        Select a class to take attendance
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
