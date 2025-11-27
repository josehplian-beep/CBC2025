import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Calendar, 
  ClipboardList,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserPlus
} from "lucide-react";

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
  _count?: { students: number };
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  students: {
    full_name: string;
  } | null;
  classes: {
    class_name: string;
  } | null;
}

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  attendanceRate: number;
  recentRecords: number;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    totalStudents: 0,
    attendanceRate: 0,
    recentRecords: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTeacherId]);

  const fetchDashboardData = async () => {
    try {
      // Fetch all teachers for selection
      const { data: teachersData, error: teachersError } = await supabase
        .from("teachers")
        .select("*")
        .order("full_name")
        .limit(1)
        .single();

      if (teachersError) throw teachersError;

      const teacherId = selectedTeacherId || teachersData?.id;
      if (!teacherId) {
        toast.error("No teacher found");
        return;
      }

      setTeacher(teachersData);

      // Fetch classes taught by this teacher
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*, student_classes(count)")
        .eq("teacher_id", teacherId);

      if (classesError) throw classesError;

      const classesWithCount = classesData?.map(cls => ({
        ...cls,
        _count: { students: cls.student_classes?.[0]?.count || 0 }
      })) || [];

      setClasses(classesWithCount);

      // Fetch recent attendance records
      const classIds = classesData?.map(c => c.id) || [];
      
      if (classIds.length > 0) {
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance_records")
          .select("*, students(full_name), classes(class_name)")
          .in("class_id", classIds)
          .order("date", { ascending: false })
          .limit(10);

        if (attendanceError) throw attendanceError;
        setRecentAttendance(attendanceData || []);

        // Calculate stats
        const totalStudents = classesWithCount.reduce((sum, cls) => sum + (cls._count?.students || 0), 0);
        const presentCount = attendanceData?.filter(r => r.status === "Present").length || 0;
        const totalRecords = attendanceData?.length || 0;
        const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

        setStats({
          totalClasses: classesData?.length || 0,
          totalStudents,
          attendanceRate,
          recentRecords: totalRecords
        });
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Present":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "Absent":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "Late":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Present: "bg-green-100 text-green-700 border-green-200",
      Absent: "bg-red-100 text-red-700 border-red-200",
      Late: "bg-yellow-100 text-yellow-700 border-yellow-200",
      Excused: "bg-gray-100 text-gray-700 border-gray-200"
    };

    return (
      <Badge variant="outline" className={variants[status] || variants.Present}>
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-accent to-primary/80 flex items-center justify-center">
        <Card className="bg-card/95 backdrop-blur-sm p-8">
          <p className="text-center">Loading dashboard...</p>
        </Card>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-accent to-primary/80 flex items-center justify-center">
        <Card className="bg-card/95 backdrop-blur-sm p-8">
          <p className="text-lg mb-4">No teacher profile found</p>
          <Button onClick={() => navigate("/admin/school/teachers")}>
            Go to Teachers
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-accent to-primary/80 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Teacher Profile Header */}
        <Card className="bg-card/95 backdrop-blur-sm shadow-lg border-2 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-accent/20">
                <AvatarImage src={teacher.photo_url || undefined} />
                <AvatarFallback className="bg-accent text-accent-foreground text-3xl">
                  {teacher.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-1">
                  Welcome back, {teacher.full_name}!
                </h1>
                <p className="text-muted-foreground text-lg">Church School Teacher Dashboard</p>
                {teacher.email && (
                  <p className="text-sm text-muted-foreground mt-2">{teacher.email}</p>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/admin/school/teachers/${teacher.id}`)}
                className="border-2 hover:border-accent"
              >
                View Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/95 backdrop-blur-sm border-2 hover:border-accent transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  My Classes
                </CardTitle>
                <BookOpen className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalClasses}</div>
              <p className="text-xs text-muted-foreground mt-1">Active classes</p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-2 hover:border-accent transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Students
                </CardTitle>
                <Users className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all classes</p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-2 hover:border-accent transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Attendance Rate
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Recent records</p>
            </CardContent>
          </Card>

          <Card className="bg-card/95 backdrop-blur-sm border-2 hover:border-accent transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Records Today
                </CardTitle>
                <ClipboardList className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.recentRecords}</div>
              <p className="text-xs text-muted-foreground mt-1">Total entries</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Classes */}
          <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-accent" />
                    My Classes
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Classes you're currently teaching
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/admin/school/classes")}
                  className="border-2 hover:border-accent"
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {classes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No classes assigned yet</p>
                </div>
              ) : (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/school/classes/${cls.id}/attendance`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{cls.class_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {cls._count?.students || 0} students
                        </p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-accent hover:bg-accent/90">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Take Attendance
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    Recent Attendance
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Latest attendance records
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/admin/school/reports")}
                  className="border-2 hover:border-accent"
                >
                  View Reports
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentAttendance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No attendance records yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recentAttendance.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {record.students?.full_name || "Unknown Student"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.classes?.class_name || "Unknown Class"} • {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(record.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-card/95 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                size="lg"
                className="h-auto py-6 flex-col gap-2 bg-accent hover:bg-accent/90"
                onClick={() => navigate("/admin/school/students")}
              >
                <Users className="h-6 w-6" />
                <span>View All Students</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-auto py-6 flex-col gap-2 border-2 hover:border-accent"
                onClick={() => navigate("/admin/school/assignments")}
              >
                <UserPlus className="h-6 w-6" />
                <span>Manage Assignments</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-auto py-6 flex-col gap-2 border-2 hover:border-accent"
                onClick={() => navigate("/admin/school/classes")}
              >
                <BookOpen className="h-6 w-6" />
                <span>Manage Classes</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-auto py-6 flex-col gap-2 border-2 hover:border-accent"
                onClick={() => navigate("/admin/school/reports")}
              >
                <TrendingUp className="h-6 w-6" />
                <span>View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
