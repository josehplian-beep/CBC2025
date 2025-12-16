import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, Phone, ArrowLeft, Edit, Users, BookOpen, Calendar as CalendarIcon, 
  Check, X, Clock, AlertCircle, UserCircle, ChevronRight, Loader2, GraduationCap
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";
import { StudentAvatar } from "@/components/StudentAvatar";

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
  student_count: number;
}

interface Student {
  id: string;
  full_name: string;
  photo_url: string | null;
  date_of_birth: string;
  guardian_name: string;
  guardian_phone: string;
}

const TeacherProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Attendance states
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<Date>(new Date());
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const canEdit = can("manage_students");
  const canTakeAttendance = can("take_attendance");

  useEffect(() => {
    if (id) {
      fetchTeacherData();
    }
  }, [id]);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);

      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", id)
        .single();

      if (teacherError) throw teacherError;
      setTeacher(teacherData);

      const { data: classTeachers, error: classError } = await supabase
        .from("class_teachers")
        .select("class_id")
        .eq("teacher_id", id);

      if (classError) throw classError;

      const classIds = classTeachers.map((ct) => ct.class_id);

      if (classIds.length > 0) {
        const { data: classesData, error: classesError } = await supabase
          .from("classes")
          .select("id, class_name, description")
          .in("id", classIds);

        if (classesError) throw classesError;

        const classesWithCount = await Promise.all(
          classesData.map(async (cls) => {
            const { count } = await supabase
              .from("student_classes")
              .select("*", { count: "exact", head: true })
              .eq("class_id", cls.id);

            return { ...cls, student_count: count || 0 };
          })
        );

        setClasses(classesWithCount);

        const { data: studentClassData, error: studentClassError } = await supabase
          .from("student_classes")
          .select("student_id")
          .in("class_id", classIds);

        if (studentClassError) throw studentClassError;

        const studentIds = [...new Set(studentClassData.map((sc) => sc.student_id))];

        if (studentIds.length > 0) {
          const { data: studentsData, error: studentsError } = await supabase
            .from("students")
            .select("*")
            .in("id", studentIds)
            .order("full_name");

          if (studentsError) throw studentsError;
          setStudents(studentsData);
        }
      }
    } catch (error: any) {
      console.error("Error fetching teacher data:", error);
      toast.error("Failed to load teacher profile");
      navigate("/admin/school/teachers");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async (classId: string) => {
    try {
      const { data: studentClassData, error: studentClassError } = await supabase
        .from("student_classes")
        .select("student_id")
        .eq("class_id", classId);

      if (studentClassError) throw studentClassError;

      const studentIds = studentClassData.map((sc) => sc.student_id);

      if (studentIds.length > 0) {
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("*")
          .in("id", studentIds)
          .order("full_name");

        if (studentsError) throw studentsError;
        setClassStudents(studentsData);

        const initialRecords: Record<string, string> = {};
        studentsData.forEach((student) => {
          initialRecords[student.id] = "present";
        });
        setAttendanceRecords(initialRecords);
      } else {
        setClassStudents([]);
        setAttendanceRecords({});
      }
    } catch (error: any) {
      console.error("Error fetching class students:", error);
      toast.error("Failed to load class students");
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    fetchClassStudents(classId);
  };

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClass || classStudents.length === 0) {
      toast.error("Please select a class with students");
      return;
    }

    try {
      setSubmitting(true);

      const attendanceData = classStudents.map((student) => ({
        class_id: selectedClass,
        student_id: student.id,
        date: format(attendanceDate, "yyyy-MM-dd"),
        status: attendanceRecords[student.id] || "present",
        taken_by: id,
      }));

      const { error } = await supabase.from("attendance_records").insert(attendanceData);

      if (error) throw error;

      toast.success("Attendance recorded successfully!");
      
      setSelectedClass("");
      setClassStudents([]);
      setAttendanceRecords({});
    } catch (error: any) {
      console.error("Error submitting attendance:", error);
      toast.error("Failed to record attendance");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Teacher not found</h2>
          <Button onClick={() => navigate("/admin/school/teachers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teachers
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section with Gradient Background */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background pt-20 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
        
        <div className="container mx-auto px-4 relative">
          {/* Navigation Bar */}
          <div className="flex justify-between items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin/school/teachers")}
              className="hover:bg-background/50 backdrop-blur-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teachers
            </Button>
            {canEdit && (
              <Button 
                onClick={() => navigate(`/admin/school/teachers/${id}/edit`)}
                className="shadow-lg hover:shadow-xl transition-shadow"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Overlapping the Hero */}
      <div className="container mx-auto px-4 -mt-24 relative z-10 pb-12">
        <div className="grid lg:grid-cols-[320px_1fr] gap-8">
          
          {/* Left Column - Profile Card */}
          <div className="space-y-6">
            {/* Profile Image Card */}
            <Card className="overflow-hidden shadow-xl border-0 bg-card/80 backdrop-blur-sm">
              <div className="aspect-square relative">
                {teacher.photo_url ? (
                  <img
                    src={teacher.photo_url}
                    alt={teacher.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-muted to-muted/50">
                    <UserCircle className="w-32 h-32 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <CardContent className="p-6 text-center">
                <h1 className="text-2xl font-bold mb-2">{teacher.full_name}</h1>
                <Badge variant="secondary" className="mb-3">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Teacher
                </Badge>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Classes</p>
                    <p className="font-medium">{classes.length} Classes</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Students</p>
                    <p className="font-medium">{students.length} Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Contact Information Card */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  {teacher.phone && (
                    <div className="group">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Phone</p>
                      <a 
                        href={`tel:${teacher.phone}`} 
                        className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        {teacher.phone}
                      </a>
                    </div>
                  )}

                  {teacher.email && (
                    <div className="group">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Email</p>
                      <a 
                        href={`mailto:${teacher.email}`} 
                        className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2 break-all"
                      >
                        <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                        {teacher.email}
                      </a>
                    </div>
                  )}
                </div>

                {teacher.bio && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Bio</p>
                    <p className="text-foreground leading-relaxed">{teacher.bio}</p>
                  </div>
                )}

                {!teacher.phone && !teacher.email && !teacher.bio && (
                  <p className="text-muted-foreground text-center py-4">No contact information available</p>
                )}
              </CardContent>
            </Card>

            {/* Tabbed Content */}
            <Tabs defaultValue="classes" className="w-full">
              <TabsList className="w-full justify-start bg-muted/30 p-1 h-auto flex-wrap">
                <TabsTrigger value="classes" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Classes
                </TabsTrigger>
                <TabsTrigger value="students" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Users className="w-4 h-4 mr-2" />
                  Students
                </TabsTrigger>
                {canTakeAttendance && classes.length > 0 && (
                  <TabsTrigger value="attendance" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Attendance
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Classes Tab */}
              <TabsContent value="classes" className="mt-6">
                <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      Assigned Classes
                      <Badge variant="outline" className="ml-auto">{classes.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {classes.length > 0 ? (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {classes.map((cls) => (
                          <button
                            key={cls.id}
                            onClick={() => navigate(`/admin/school/classes/${cls.id}/edit`)}
                            className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 text-left group border border-transparent hover:border-primary/20"
                          >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate group-hover:text-primary transition-colors">
                                {cls.class_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {cls.student_count} student{cls.student_count !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="h-8 w-8 opacity-50" />
                        </div>
                        <p className="font-medium">No classes assigned yet</p>
                        <p className="text-sm mt-1">Classes will appear here when assigned</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="mt-6">
                <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      Students
                      <Badge variant="outline" className="ml-auto">{students.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {students.length > 0 ? (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {students.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-primary/20 group"
                          >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-background">
                              {student.photo_url ? (
                                <img
                                  src={student.photo_url}
                                  alt={student.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <UserCircle className="w-6 h-6 text-primary/60" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate group-hover:text-primary transition-colors">
                                {student.full_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Age {new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                Guardian: {student.guardian_name}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <Users className="h-8 w-8 opacity-50" />
                        </div>
                        <p className="font-medium">No students assigned yet</p>
                        <p className="text-sm mt-1">Students will appear here when enrolled in classes</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attendance Tab */}
              {canTakeAttendance && classes.length > 0 && (
                <TabsContent value="attendance" className="mt-6">
                  <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CalendarIcon className="w-4 h-4 text-primary" />
                        </div>
                        Take Attendance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Class and Date Selection */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Select Class</label>
                          <Select value={selectedClass} onValueChange={handleClassChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a class" />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.class_name} ({cls.student_count} students)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Select Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(attendanceDate, "PPP")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={attendanceDate}
                                onSelect={(date) => date && setAttendanceDate(date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Student Attendance List */}
                      {classStudents.length > 0 && (
                        <>
                          <div className="border-t pt-6">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-medium">{classStudents.length} Students</span>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <Check className="h-3 w-3 mr-1" />Present
                                </Badge>
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <X className="h-3 w-3 mr-1" />Absent
                                </Badge>
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  <Clock className="h-3 w-3 mr-1" />Late
                                </Badge>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  <AlertCircle className="h-3 w-3 mr-1" />Excused
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                              {classStudents.map((student) => (
                                <div 
                                  key={student.id} 
                                  className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all group"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <StudentAvatar 
                                      photoUrl={student.photo_url} 
                                      fullName={student.full_name}
                                      className="h-10 w-10 border-2 border-primary/10 group-hover:border-primary/30 transition-colors"
                                      fallbackClassName="text-sm"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium truncate">{student.full_name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        Age {new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex gap-1 shrink-0">
                                    <Button
                                      size="sm"
                                      variant={attendanceRecords[student.id] === "present" ? "default" : "ghost"}
                                      className={`h-9 w-9 p-0 ${attendanceRecords[student.id] === "present" ? "bg-green-500 hover:bg-green-600" : "hover:bg-green-50"}`}
                                      onClick={() => handleAttendanceChange(student.id, "present")}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={attendanceRecords[student.id] === "absent" ? "default" : "ghost"}
                                      className={`h-9 w-9 p-0 ${attendanceRecords[student.id] === "absent" ? "bg-red-500 hover:bg-red-600" : "hover:bg-red-50"}`}
                                      onClick={() => handleAttendanceChange(student.id, "absent")}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={attendanceRecords[student.id] === "late" ? "default" : "ghost"}
                                      className={`h-9 w-9 p-0 ${attendanceRecords[student.id] === "late" ? "bg-yellow-500 hover:bg-yellow-600" : "hover:bg-yellow-50"}`}
                                      onClick={() => handleAttendanceChange(student.id, "late")}
                                    >
                                      <Clock className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={attendanceRecords[student.id] === "excused" ? "default" : "ghost"}
                                      className={`h-9 w-9 p-0 ${attendanceRecords[student.id] === "excused" ? "bg-blue-500 hover:bg-blue-600" : "hover:bg-blue-50"}`}
                                      onClick={() => handleAttendanceChange(student.id, "excused")}
                                    >
                                      <AlertCircle className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedClass("");
                                setClassStudents([]);
                                setAttendanceRecords({});
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSubmitAttendance}
                              disabled={submitting}
                              className="shadow-md"
                            >
                              {submitting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                "Submit Attendance"
                              )}
                            </Button>
                          </div>
                        </>
                      )}

                      {selectedClass && classStudents.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 opacity-50" />
                          </div>
                          <p className="font-medium">No students in this class</p>
                          <p className="text-sm mt-1">Add students to the class first</p>
                        </div>
                      )}

                      {!selectedClass && (
                        <div className="text-center py-12 text-muted-foreground">
                          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                            <CalendarIcon className="h-8 w-8 opacity-50" />
                          </div>
                          <p className="font-medium">Select a class to take attendance</p>
                          <p className="text-sm mt-1">Choose a class from the dropdown above</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default TeacherProfile;
