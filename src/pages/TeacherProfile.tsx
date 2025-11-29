import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Mail, Phone, ArrowLeft, Edit, Users, BookOpen, Calendar as CalendarIcon, Check, X, Clock, AlertCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";

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

      // Fetch teacher details
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", id)
        .single();

      if (teacherError) throw teacherError;
      setTeacher(teacherData);

      // Fetch classes taught by this teacher
      const { data: classTeachers, error: classError } = await supabase
        .from("class_teachers")
        .select("class_id")
        .eq("teacher_id", id);

      if (classError) throw classError;

      const classIds = classTeachers.map((ct) => ct.class_id);

      if (classIds.length > 0) {
        // Fetch class details
        const { data: classesData, error: classesError } = await supabase
          .from("classes")
          .select("id, class_name, description")
          .in("id", classIds);

        if (classesError) throw classesError;

        // Fetch student count for each class
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

        // Fetch all students in these classes
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

        // Initialize attendance records
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
      
      // Reset
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
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
        <Navigation />
        <div className="container mx-auto px-4 py-24">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
        <Navigation />
        <div className="container mx-auto px-4 py-24 text-center">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <Navigation />
      <div className="container mx-auto px-4 py-20 max-w-7xl">
        {/* Compact Header */}
        <div className="mb-6 animate-fade-in">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/admin/school/teachers")}
            className="mb-4 hover-scale"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teachers
          </Button>
          
          {/* Compact Profile Header */}
          <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20 border-4 border-primary/20 shadow-md hover-scale transition-all">
                  <AvatarImage src={teacher.photo_url || ""} alt={teacher.full_name} />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {teacher.full_name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold mb-1">{teacher.full_name}</h1>
                      <Badge variant="secondary" className="mb-3">
                        <Users className="h-3 w-3 mr-1" />
                        Teacher
                      </Badge>
                    </div>
                    {canEdit && (
                      <Button size="sm" asChild className="hover-scale">
                        <Link to={`/admin/school/teachers/${id}/edit`}>
                          <Edit className="mr-2 h-3 w-3" />
                          Edit
                        </Link>
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {teacher.email && (
                      <a 
                        href={`mailto:${teacher.email}`} 
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                      >
                        <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span className="truncate">{teacher.email}</span>
                      </a>
                    )}
                    {teacher.phone && (
                      <a 
                        href={`tel:${teacher.phone}`} 
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                      >
                        <Phone className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span>{teacher.phone}</span>
                      </a>
                    )}
                  </div>

                  {teacher.bio && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {teacher.bio}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Classes Grid - More Compact */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Classes
              <Badge variant="outline" className="ml-2">{classes.length}</Badge>
            </h2>
          </div>
          
          {classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls, index) => (
                <Card 
                  key={cls.id} 
                  className="group border hover:border-primary transition-all hover:shadow-lg hover:-translate-y-1 duration-300 animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold mb-1 truncate group-hover:text-primary transition-colors">
                          {cls.class_name}
                        </h4>
                        {cls.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                            {cls.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{cls.student_count} student{cls.student_count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" asChild className="shrink-0 hover-scale">
                        <Link to={`/admin/school/classes/${cls.id}/edit`}>
                          <ArrowLeft className="h-4 w-4 rotate-180" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">No classes assigned yet</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Take Attendance Section - Compact and Interactive */}
        {canTakeAttendance && classes.length > 0 && (
          <Card className="border-2 shadow-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Take Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Class and Date Selection - More Compact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Class</label>
                  <Select value={selectedClass} onValueChange={handleClassChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Choose a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.class_name} ({cls.student_count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-9 w-full justify-start text-left font-normal text-sm">
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
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

              {/* Student Attendance List - Compact Cards */}
              {classStudents.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{classStudents.length} Students</span>
                      <div className="flex gap-1.5">
                        <Badge variant="outline" className="h-6 text-xs bg-green-50 text-green-700 border-green-200">
                          <Check className="h-3 w-3 mr-1" />P
                        </Badge>
                        <Badge variant="outline" className="h-6 text-xs bg-red-50 text-red-700 border-red-200">
                          <X className="h-3 w-3 mr-1" />A
                        </Badge>
                        <Badge variant="outline" className="h-6 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Clock className="h-3 w-3 mr-1" />L
                        </Badge>
                        <Badge variant="outline" className="h-6 text-xs bg-blue-50 text-blue-700 border-blue-200">
                          <AlertCircle className="h-3 w-3 mr-1" />E
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {classStudents.map((student, index) => (
                        <div 
                          key={student.id} 
                          className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-all group animate-scale-in"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-9 w-9 border-2 border-primary/10 group-hover:border-primary/30 transition-colors">
                              <AvatarImage src={student.photo_url || ""} alt={student.full_name} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-xs">
                                {student.full_name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{student.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Age {new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant={attendanceRecords[student.id] === "present" ? "default" : "ghost"}
                              className={`h-8 w-8 p-0 hover-scale ${attendanceRecords[student.id] === "present" ? "bg-green-500 hover:bg-green-600" : "hover:bg-green-50"}`}
                              onClick={() => handleAttendanceChange(student.id, "present")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={attendanceRecords[student.id] === "absent" ? "default" : "ghost"}
                              className={`h-8 w-8 p-0 hover-scale ${attendanceRecords[student.id] === "absent" ? "bg-red-500 hover:bg-red-600" : "hover:bg-red-50"}`}
                              onClick={() => handleAttendanceChange(student.id, "absent")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={attendanceRecords[student.id] === "late" ? "default" : "ghost"}
                              className={`h-8 w-8 p-0 hover-scale ${attendanceRecords[student.id] === "late" ? "bg-yellow-500 hover:bg-yellow-600" : "hover:bg-yellow-50"}`}
                              onClick={() => handleAttendanceChange(student.id, "late")}
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={attendanceRecords[student.id] === "excused" ? "default" : "ghost"}
                              className={`h-8 w-8 p-0 hover-scale ${attendanceRecords[student.id] === "excused" ? "bg-blue-500 hover:bg-blue-600" : "hover:bg-blue-50"}`}
                              onClick={() => handleAttendanceChange(student.id, "excused")}
                            >
                              <AlertCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
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
                      size="sm"
                      onClick={handleSubmitAttendance}
                      disabled={submitting}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover-scale"
                    >
                      {submitting ? "Submitting..." : "Submit Attendance"}
                    </Button>
                  </div>
                </>
              )}

              {selectedClass && classStudents.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-muted-foreground">No students in this class</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Students Section */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-accent/10 via-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {students.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => (
                  <Card key={student.id} className="border hover:border-accent transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={student.photo_url || ""} alt={student.full_name} />
                          <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-primary-foreground">
                            {student.full_name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold truncate">{student.full_name}</h5>
                          <p className="text-xs text-muted-foreground">
                            Age: {new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()}
                          </p>
                          <Separator className="my-2" />
                          <div className="text-xs text-muted-foreground">
                            <p className="truncate">Guardian: {student.guardian_name}</p>
                            <p className="truncate">{student.guardian_phone}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No students assigned yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default TeacherProfile;
