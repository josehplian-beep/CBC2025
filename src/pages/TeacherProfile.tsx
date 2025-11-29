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
      <div className="container mx-auto px-4 py-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate("/admin/school/teachers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teachers
          </Button>
          {canEdit && (
            <Button asChild>
              <Link to={`/admin/school/teachers/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
          )}
        </div>

        {/* Teacher Profile Card */}
        <Card className="mb-8 overflow-hidden border-2 shadow-xl">
          <div className="h-32 bg-gradient-to-r from-primary via-accent to-primary/80" />
          <CardContent className="relative pt-0 px-8 pb-8">
            <div className="flex flex-col md:flex-row gap-6 -mt-16">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={teacher.photo_url || ""} alt={teacher.full_name} />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {teacher.full_name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 mt-16 md:mt-0">
                <h1 className="text-4xl font-display font-bold mb-2">{teacher.full_name}</h1>
                <Badge className="mb-4 bg-gradient-to-r from-primary to-accent">Teacher</Badge>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {teacher.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${teacher.email}`} className="hover:text-primary transition-colors">
                        {teacher.email}
                      </a>
                    </div>
                  )}
                  {teacher.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${teacher.phone}`} className="hover:text-primary transition-colors">
                        {teacher.phone}
                      </a>
                    </div>
                  )}
                </div>

                {teacher.bio && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">About</h3>
                      <p className="text-muted-foreground leading-relaxed">{teacher.bio}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classes Section */}
        <Card className="mb-8 border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Classes ({classes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {classes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map((cls) => (
                  <Card key={cls.id} className="border hover:border-primary transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">{cls.class_name}</h4>
                          {cls.description && (
                            <p className="text-sm text-muted-foreground mb-2">{cls.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{cls.student_count} {cls.student_count === 1 ? "Student" : "Students"}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/admin/school/classes/${cls.id}/edit`}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No classes assigned yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Take Attendance Section */}
        {canTakeAttendance && classes.length > 0 && (
          <Card className="mb-8 border-2 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-green-500/10 via-blue-500/10 to-green-500/10">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Take Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Class and Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Class</label>
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
                  <label className="text-sm font-medium">Attendance Date</label>
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
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Mark Attendance ({classStudents.length} students)</h4>
                      <div className="flex gap-2 text-xs">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Check className="h-3 w-3 mr-1" />
                          Present
                        </Badge>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <X className="h-3 w-3 mr-1" />
                          Absent
                        </Badge>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Late
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Excused
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {classStudents.map((student) => (
                        <Card key={student.id} className="border-2 hover:shadow-md transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={student.photo_url || ""} alt={student.full_name} />
                                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm">
                                    {student.full_name.split(" ").map((n) => n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold">{student.full_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Age: {new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={attendanceRecords[student.id] === "present" ? "default" : "outline"}
                                  className={attendanceRecords[student.id] === "present" ? "bg-green-500 hover:bg-green-600" : ""}
                                  onClick={() => handleAttendanceChange(student.id, "present")}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant={attendanceRecords[student.id] === "absent" ? "default" : "outline"}
                                  className={attendanceRecords[student.id] === "absent" ? "bg-red-500 hover:bg-red-600" : ""}
                                  onClick={() => handleAttendanceChange(student.id, "absent")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant={attendanceRecords[student.id] === "late" ? "default" : "outline"}
                                  className={attendanceRecords[student.id] === "late" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                                  onClick={() => handleAttendanceChange(student.id, "late")}
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant={attendanceRecords[student.id] === "excused" ? "default" : "outline"}
                                  className={attendanceRecords[student.id] === "excused" ? "bg-blue-500 hover:bg-blue-600" : ""}
                                  onClick={() => handleAttendanceChange(student.id, "excused")}
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end gap-3">
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
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    >
                      {submitting ? "Submitting..." : "Submit Attendance"}
                    </Button>
                  </div>
                </>
              )}

              {selectedClass && classStudents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No students in this class</p>
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
