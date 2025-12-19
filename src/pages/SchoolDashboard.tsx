import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { AdminLayout } from "@/components/AdminLayout";
import { ClassPanel } from "@/components/school/ClassPanel";
import { ClassDetailPanel } from "@/components/school/ClassDetailPanel";
import { DraggableMemberCard } from "@/components/school/DraggableMemberCard";
import { TeachersListPanel } from "@/components/school/TeachersListPanel";
import { StudentsListPanel } from "@/components/school/StudentsListPanel";
import { ReportsPanel } from "@/components/school/ReportsPanel";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, GraduationCap, BookOpen, CalendarCheck, LayoutGrid, FileText } from "lucide-react";

interface Class {
  id: string;
  class_name: string;
  description: string | null;
}

interface Teacher {
  id: string;
  full_name: string;
  photo_url: string | null;
  member_id: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  // Linked member data (from join)
  member?: {
    id: string;
    name: string;
    profile_image_url: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

interface Student {
  id: string;
  full_name: string;
  photo_url: string | null;
  date_of_birth: string;
  guardian_name: string;
  guardian_phone: string;
  member_id: string | null;
}

interface Member {
  id: string;
  name: string;
  profile_image_url: string | null;
  phone: string | null;
  email: string | null;
}

interface AttendanceRecord {
  student_id: string;
  status: "Present" | "Absent" | "Late";
}

interface CheckinSession {
  id: string;
  name: string;
  session_date: string;
  is_active: boolean;
}

type DashboardView = "classes" | "teachers" | "students" | "reports";

export default function SchoolDashboard() {
  const [activeView, setActiveView] = useState<DashboardView>("classes");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [classTeachers, setClassTeachers] = useState<Teacher[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<CheckinSession | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<"teacher" | "student" | "member" | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Stats
  const stats = {
    totalTeachers: teachers.length,
    totalStudents: students.length,
    totalClasses: classes.length,
    activeSessions: activeSession ? 1 : 0,
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [classesRes, teachersRes, studentsRes, membersRes] = await Promise.all([
        supabase.from("classes").select("*").order("class_name"),
        // Join teachers with members to get linked member data
        supabase.from("teachers").select(`
          *,
          member:members!teachers_member_id_fkey (
            id,
            name,
            profile_image_url,
            phone,
            email
          )
        `).order("full_name"),
        supabase.from("students").select("*").order("full_name"),
        supabase.from("members").select("id, name, profile_image_url, phone, email").order("name"),
      ]);

      if (classesRes.error) throw classesRes.error;
      if (teachersRes.error) throw teachersRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (membersRes.error) throw membersRes.error;

      setClasses(classesRes.data || []);
      setTeachers(teachersRes.data || []);
      setStudents(studentsRes.data || []);
      setMembers(membersRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClassAssignments = useCallback(async (classId: string) => {
    try {
      const { data: classTeacherLinks, error: ctError } = await supabase
        .from("class_teachers")
        .select("teacher_id")
        .eq("class_id", classId);

      if (ctError) throw ctError;

      const teacherIds = classTeacherLinks?.map((ct) => ct.teacher_id) || [];
      const assignedTeachers = teachers.filter((t) => teacherIds.includes(t.id));
      setClassTeachers(assignedTeachers);

      const { data: studentClassLinks, error: scError } = await supabase
        .from("student_classes")
        .select("student_id")
        .eq("class_id", classId);

      if (scError) throw scError;

      const studentIds = studentClassLinks?.map((sc) => sc.student_id) || [];
      const assignedStudents = students.filter((s) => studentIds.includes(s.id));
      setClassStudents(assignedStudents);

      const { data: sessions } = await supabase
        .from("checkin_sessions")
        .select("*")
        .eq("class_id", classId)
        .eq("is_active", true)
        .single();

      setActiveSession(sessions || null);

      if (sessions) {
        const { data: attendanceData } = await supabase
          .from("attendance_records")
          .select("student_id, status")
          .eq("class_id", classId)
          .eq("date", new Date().toISOString().split("T")[0]);

        setAttendance(
          (attendanceData || []).map((a) => ({
            student_id: a.student_id,
            status: a.status as "Present" | "Absent" | "Late",
          }))
        );
      } else {
        setAttendance([]);
      }
    } catch (error) {
      console.error("Error fetching class assignments:", error);
    }
  }, [teachers, students]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassAssignments(selectedClass.id);
    }
  }, [selectedClass, fetchClassAssignments]);

  const handleSelectClass = (cls: Class) => {
    setSelectedClass(cls);
    setActiveSession(null);
    setAttendance([]);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    
    if (id.startsWith("teacher-")) {
      setActiveDragId(id.replace("teacher-", ""));
      setActiveDragType("teacher");
    } else if (id.startsWith("student-")) {
      setActiveDragId(id.replace("student-", ""));
      setActiveDragType("student");
    } else if (id.startsWith("member-")) {
      setActiveDragId(id.replace("member-", ""));
      setActiveDragType("member");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setActiveDragType(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle dropping onto a class card (from Teachers/Students list views)
    if (overId.startsWith("class-drop-")) {
      const targetClassId = overId.replace("class-drop-", "");
      
      if (activeId.startsWith("teacher-")) {
        const teacherId = activeId.replace("teacher-", "");
        try {
          // Check if already assigned
          const { data: existing } = await supabase
            .from("class_teachers")
            .select("id")
            .eq("class_id", targetClassId)
            .eq("teacher_id", teacherId)
            .single();

          if (!existing) {
            const { error } = await supabase.from("class_teachers").insert({
              class_id: targetClassId,
              teacher_id: teacherId,
            });
            if (error) throw error;
            toast.success("Teacher assigned to class");
            if (selectedClass?.id === targetClassId) {
              fetchClassAssignments(targetClassId);
            }
          } else {
            toast.info("Teacher already assigned to this class");
          }
        } catch (error) {
          console.error("Error assigning teacher:", error);
          toast.error("Failed to assign teacher");
        }
      }

      if (activeId.startsWith("student-")) {
        const studentId = activeId.replace("student-", "");
        try {
          const { data: existing } = await supabase
            .from("student_classes")
            .select("id")
            .eq("class_id", targetClassId)
            .eq("student_id", studentId)
            .single();

          if (!existing) {
            const { error } = await supabase.from("student_classes").insert({
              class_id: targetClassId,
              student_id: studentId,
            });
            if (error) throw error;
            toast.success("Student assigned to class");
            if (selectedClass?.id === targetClassId) {
              fetchClassAssignments(targetClassId);
            }
          } else {
            toast.info("Student already enrolled in this class");
          }
        } catch (error) {
          console.error("Error assigning student:", error);
          toast.error("Failed to assign student");
        }
      }

      if (activeId.startsWith("member-")) {
        const memberId = activeId.replace("member-", "");
        const member = members.find((m) => m.id === memberId);
        
        if (member) {
          // Check if member is already a teacher
          const existingTeacher = teachers.find((t) => t.member_id === memberId);
          
          if (existingTeacher) {
            // Assign existing teacher to class
            try {
              const { data: existing } = await supabase
                .from("class_teachers")
                .select("id")
                .eq("class_id", targetClassId)
                .eq("teacher_id", existingTeacher.id)
                .single();

              if (!existing) {
                const { error } = await supabase.from("class_teachers").insert({
                  class_id: targetClassId,
                  teacher_id: existingTeacher.id,
                });
                if (error) throw error;
                toast.success("Teacher assigned to class");
              } else {
                toast.info("Teacher already assigned to this class");
              }
            } catch (error) {
              console.error("Error assigning teacher:", error);
              toast.error("Failed to assign teacher");
            }
          } else {
            // Create new teacher from member
            try {
              const { data: newTeacher, error: teacherError } = await supabase
                .from("teachers")
                .insert({
                  full_name: member.name,
                  member_id: member.id,
                  photo_url: member.profile_image_url,
                  email: member.email,
                  phone: member.phone,
                })
                .select()
                .single();

              if (teacherError) throw teacherError;

              const { error: assignError } = await supabase.from("class_teachers").insert({
                class_id: targetClassId,
                teacher_id: newTeacher.id,
              });

              if (assignError) throw assignError;

              toast.success("Member added as teacher and assigned to class");
              fetchData();
            } catch (error) {
              console.error("Error creating teacher from member:", error);
              toast.error("Failed to add member as teacher");
            }
          }
        }
      }
      return;
    }

    // Original drop zone logic for class detail view
    if (!selectedClass) return;

    if (activeId.startsWith("teacher-") && overId === "teachers-drop-zone") {
      const teacherId = activeId.replace("teacher-", "");
      const isAlreadyAssigned = classTeachers.some((t) => t.id === teacherId);
      
      if (!isAlreadyAssigned) {
        try {
          const { error } = await supabase.from("class_teachers").insert({
            class_id: selectedClass.id,
            teacher_id: teacherId,
          });

          if (error) throw error;
          toast.success("Teacher assigned to class");
          fetchClassAssignments(selectedClass.id);
        } catch (error) {
          console.error("Error assigning teacher:", error);
          toast.error("Failed to assign teacher");
        }
      }
    }

    if (activeId.startsWith("student-") && overId === "students-drop-zone") {
      const studentId = activeId.replace("student-", "");
      const isAlreadyAssigned = classStudents.some((s) => s.id === studentId);
      
      if (!isAlreadyAssigned) {
        try {
          const { error } = await supabase.from("student_classes").insert({
            class_id: selectedClass.id,
            student_id: studentId,
          });

          if (error) throw error;
          toast.success("Student assigned to class");
          fetchClassAssignments(selectedClass.id);
        } catch (error) {
          console.error("Error assigning student:", error);
          toast.error("Failed to assign student");
        }
      }
    }

    if (activeId.startsWith("member-")) {
      const memberId = activeId.replace("member-", "");
      const member = members.find((m) => m.id === memberId);

      if (overId === "teachers-drop-zone" && member) {
        const existingTeacher = teachers.find((t) => t.member_id === memberId);
        
        if (existingTeacher) {
          const isAlreadyAssigned = classTeachers.some((t) => t.id === existingTeacher.id);
          if (!isAlreadyAssigned) {
            try {
              const { error } = await supabase.from("class_teachers").insert({
                class_id: selectedClass.id,
                teacher_id: existingTeacher.id,
              });
              if (error) throw error;
              toast.success("Teacher assigned to class");
              fetchClassAssignments(selectedClass.id);
            } catch (error) {
              console.error("Error assigning teacher:", error);
              toast.error("Failed to assign teacher");
            }
          }
        } else {
          try {
            const { data: newTeacher, error: teacherError } = await supabase
              .from("teachers")
              .insert({
                full_name: member.name,
                member_id: member.id,
                photo_url: member.profile_image_url,
                email: member.email,
                phone: member.phone,
              })
              .select()
              .single();

            if (teacherError) throw teacherError;

            const { error: assignError } = await supabase.from("class_teachers").insert({
              class_id: selectedClass.id,
              teacher_id: newTeacher.id,
            });

            if (assignError) throw assignError;

            toast.success("Member added as teacher");
            fetchData();
            fetchClassAssignments(selectedClass.id);
          } catch (error) {
            console.error("Error creating teacher from member:", error);
            toast.error("Failed to add member as teacher");
          }
        }
      }
    }
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    if (!selectedClass) return;
    
    try {
      const { error } = await supabase
        .from("class_teachers")
        .delete()
        .eq("class_id", selectedClass.id)
        .eq("teacher_id", teacherId);

      if (error) throw error;
      toast.success("Teacher removed from class");
      fetchClassAssignments(selectedClass.id);
    } catch (error) {
      console.error("Error removing teacher:", error);
      toast.error("Failed to remove teacher");
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClass) return;
    
    try {
      const { error } = await supabase
        .from("student_classes")
        .delete()
        .eq("class_id", selectedClass.id)
        .eq("student_id", studentId);

      if (error) throw error;
      toast.success("Student removed from class");
      fetchClassAssignments(selectedClass.id);
    } catch (error) {
      console.error("Error removing student:", error);
      toast.error("Failed to remove student");
    }
  };

  const handleAssignTeacherDirect = async (teacherId: string) => {
    if (!selectedClass) return;

    try {
      const { error } = await supabase.from("class_teachers").insert({
        class_id: selectedClass.id,
        teacher_id: teacherId,
      });

      if (error) throw error;
      toast.success("Teacher assigned to class");
      fetchClassAssignments(selectedClass.id);
    } catch (error) {
      console.error("Error assigning teacher:", error);
      toast.error("Failed to assign teacher");
    }
  };

  const handleAssignStudentDirect = async (studentId: string) => {
    if (!selectedClass) return;

    try {
      const { error } = await supabase.from("student_classes").insert({
        class_id: selectedClass.id,
        student_id: studentId,
      });

      if (error) throw error;
      toast.success("Student enrolled in class");
      fetchClassAssignments(selectedClass.id);
    } catch (error) {
      console.error("Error enrolling student:", error);
      toast.error("Failed to enroll student");
    }
  };

  const handleStartSession = async () => {
    if (!selectedClass) return;

    try {
      const { data, error } = await supabase
        .from("checkin_sessions")
        .insert({
          name: `${selectedClass.class_name} - ${new Date().toLocaleDateString()}`,
          class_id: selectedClass.id,
          session_type: "class",
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      setActiveSession(data);
      toast.success("Check-in session started");
    } catch (error) {
      console.error("Error starting session:", error);
      toast.error("Failed to start session");
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      const { error } = await supabase
        .from("checkin_sessions")
        .update({ is_active: false })
        .eq("id", activeSession.id);

      if (error) throw error;
      setActiveSession(null);
      toast.success("Session ended");
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error("Failed to end session");
    }
  };

  const handleAttendanceChange = async (studentId: string, status: "Present" | "Absent" | "Late") => {
    if (!selectedClass) return;

    const today = new Date().toISOString().split("T")[0];
    
    try {
      const existingIndex = attendance.findIndex((a) => a.student_id === studentId);
      
      if (existingIndex >= 0) {
        const { error } = await supabase
          .from("attendance_records")
          .update({ status })
          .eq("class_id", selectedClass.id)
          .eq("student_id", studentId)
          .eq("date", today);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("attendance_records").insert({
          class_id: selectedClass.id,
          student_id: studentId,
          date: today,
          status,
        });

        if (error) throw error;
      }

      setAttendance((prev) => {
        const updated = prev.filter((a) => a.student_id !== studentId);
        return [...updated, { student_id: studentId, status }];
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast.error("Failed to update attendance");
    }
  };

  const getDragOverlayContent = () => {
    if (!activeDragId || !activeDragType) return null;

    if (activeDragType === "teacher") {
      const teacher = teachers.find((t) => t.id === activeDragId);
      if (teacher) {
        return <DraggableMemberCard name={teacher.full_name} imageUrl={teacher.photo_url} type="teacher" isDragging />;
      }
    }

    if (activeDragType === "student") {
      const student = students.find((s) => s.id === activeDragId);
      if (student) {
        return <DraggableMemberCard name={student.full_name} imageUrl={student.photo_url} type="student" isDragging />;
      }
    }

    if (activeDragType === "member") {
      const member = members.find((m) => m.id === activeDragId);
      if (member) {
        return <DraggableMemberCard name={member.name} imageUrl={member.profile_image_url} type="member" isDragging />;
      }
    }

    return null;
  };

  const renderMainContent = () => {
    switch (activeView) {
      case "teachers":
        return (
          <TeachersListPanel
            teachers={teachers}
            classes={classes}
            onRefresh={fetchData}
          />
        );
      case "students":
        return (
          <StudentsListPanel
            students={students}
            classes={classes}
            onRefresh={fetchData}
          />
        );
      case "reports":
        return (
          <ReportsPanel
            classes={classes}
            students={students}
            teachers={teachers}
          />
        );
      default:
        return (
          <div className="flex h-[calc(100vh-220px)]">
            <ClassPanel
              classes={classes}
              selectedClass={selectedClass}
              onSelectClass={handleSelectClass}
              loading={loading}
              onClassCreated={fetchData}
            />
            <ClassDetailPanel
              selectedClass={selectedClass}
              classTeachers={classTeachers}
              classStudents={classStudents}
              allTeachers={teachers}
              allStudents={students}
              activeSession={activeSession}
              attendance={attendance}
              onRemoveTeacher={handleRemoveTeacher}
              onRemoveStudent={handleRemoveStudent}
              onAssignTeacher={handleAssignTeacherDirect}
              onAssignStudent={handleAssignStudentDirect}
              onStartSession={handleStartSession}
              onEndSession={handleEndSession}
              onAttendanceChange={handleAttendanceChange}
            />
          </div>
        );
    }
  };

  return (
    <AdminLayout>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="min-h-screen bg-background">
          {/* Header with Stats and Tabs */}
          <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-foreground">School Management</h1>
                <Tabs value={activeView} onValueChange={(v) => setActiveView(v as DashboardView)}>
                  <TabsList className="bg-muted/50">
                    <TabsTrigger value="classes" className="gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      Classes
                    </TabsTrigger>
                    <TabsTrigger value="teachers" className="gap-2">
                      <Users className="h-4 w-4" />
                      Teachers
                    </TabsTrigger>
                    <TabsTrigger value="students" className="gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Students
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Reports
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-3 bg-primary/5 border-primary/20">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalTeachers}</p>
                    <p className="text-sm text-muted-foreground">Teachers</p>
                  </div>
                </Card>
                <Card className="p-4 flex items-center gap-3 bg-accent/5 border-accent/20">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <GraduationCap className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
                    <p className="text-sm text-muted-foreground">Students</p>
                  </div>
                </Card>
                <Card className="p-4 flex items-center gap-3 bg-secondary border-border">
                  <div className="p-2 rounded-lg bg-secondary">
                    <BookOpen className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalClasses}</p>
                    <p className="text-sm text-muted-foreground">Classes</p>
                  </div>
                </Card>
                <Card className="p-4 flex items-center gap-3 bg-green-500/5 border-green-500/20">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CalendarCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.activeSessions}</p>
                    <p className="text-sm text-muted-foreground">Active Sessions</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {renderMainContent()}
        </div>

        <DragOverlay>{getDragOverlayContent()}</DragOverlay>
      </DndContext>
    </AdminLayout>
  );
}
