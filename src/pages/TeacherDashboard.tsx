import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Users, BookOpen, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStatCard } from "@/components/DashboardStatCard";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface Stats {
  classes: number;
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
}

interface ClassInfo {
  id: string;
  class_name: string;
  student_count: number;
}

interface RecentAttendance {
  id: string;
  date: string;
  status: string;
  student_name: string;
  class_name: string;
  notes: string | null;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    classes: 0,
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0,
  });
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<RecentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      
      // Get current user's teacher profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First check if user has a teacher record linked to their profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", user.id)
        .single();

      if (!profile?.email) return;

      const { data: teacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("email", profile.email)
        .maybeSingle();

      if (!teacher) return;

      setTeacherId(teacher.id);

      // Fetch classes taught by this teacher
      const { data: classTeachers } = await supabase
        .from("class_teachers")
        .select(`
          class_id,
          classes (
            id,
            class_name
          )
        `)
        .eq("teacher_id", teacher.id);

      const classIds = classTeachers?.map(ct => ct.class_id) || [];

      if (classIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch student counts for each class
      const classInfoPromises = classIds.map(async (classId) => {
        const { count } = await supabase
          .from("student_classes")
          .select("*", { count: "exact", head: true })
          .eq("class_id", classId);

        const classData = classTeachers?.find(ct => ct.class_id === classId);
        return {
          id: classId,
          class_name: (classData?.classes as any)?.class_name || "Unknown",
          student_count: count || 0,
        };
      });

      const classInfos = await Promise.all(classInfoPromises);
      setClasses(classInfos);

      // Calculate total students
      const totalStudents = classInfos.reduce((sum, c) => sum + c.student_count, 0);

      // Fetch today's attendance for these classes
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAttendance } = await supabase
        .from("attendance_records")
        .select("status")
        .in("class_id", classIds)
        .eq("date", today);

      const presentToday = todayAttendance?.filter(a => a.status === "present").length || 0;
      const absentToday = todayAttendance?.filter(a => a.status === "absent").length || 0;

      // Calculate attendance rate (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: recentAttendanceData } = await supabase
        .from("attendance_records")
        .select("status")
        .in("class_id", classIds)
        .gte("date", thirtyDaysAgo.toISOString().split('T')[0]);

      const totalRecent = recentAttendanceData?.length || 0;
      const presentRecent = recentAttendanceData?.filter(a => a.status === "present").length || 0;
      const attendanceRate = totalRecent > 0 ? Math.round((presentRecent / totalRecent) * 100) : 0;

      // Fetch recent attendance records with student and class info
      const { data: recentRecords } = await supabase
        .from("attendance_records")
        .select(`
          id,
          date,
          status,
          notes,
          students (full_name),
          classes (class_name)
        `)
        .in("class_id", classIds)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10);

      const formattedRecords: RecentAttendance[] = recentRecords?.map(record => ({
        id: record.id,
        date: record.date,
        status: record.status,
        student_name: (record.students as any)?.full_name || "Unknown",
        class_name: (record.classes as any)?.class_name || "Unknown",
        notes: record.notes,
      })) || [];

      setRecentAttendance(formattedRecords);

      setStats({
        classes: classInfos.length,
        totalStudents,
        presentToday,
        absentToday,
        attendanceRate,
      });

    } catch (error) {
      console.error("Error fetching teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      present: "bg-green-500/10 text-green-500 border-green-500/20",
      absent: "bg-red-500/10 text-red-500 border-red-500/20",
      late: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      excused: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    };
    return badges[status as keyof typeof badges] || "bg-muted text-muted-foreground";
  };

  const getStatCards = () => {
    return [
      {
        title: "My Classes",
        value: stats.classes,
        icon: BookOpen,
        iconColor: "text-primary",
        link: undefined,
      },
      {
        title: "Total Students",
        value: stats.totalStudents,
        icon: Users,
        iconColor: "text-accent",
        link: undefined,
      },
      {
        title: "Present Today",
        value: stats.presentToday,
        icon: CheckCircle,
        iconColor: "text-green-500",
        link: undefined,
      },
      {
        title: "Attendance Rate",
        value: stats.attendanceRate,
        icon: TrendingUp,
        iconColor: "text-blue-500",
        link: undefined,
      },
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <Navigation />
        <div className="container mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!teacherId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Teacher Profile Found</h3>
              <p className="text-muted-foreground text-center">
                You need to have a teacher profile linked to your account to access this dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Navigation />
      <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent p-8 shadow-2xl border-2 border-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold text-white mb-2">
                Teacher Dashboard
              </h1>
              <p className="text-white/90 text-lg">
                Overview of your classes and student attendance
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {getStatCards().map((stat, index) => (
            <DashboardStatCard key={index} {...stat} />
          ))}
        </div>

        {/* Classes and Recent Attendance */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* My Classes */}
          <Card className="border-2 rounded-2xl shadow-lg bg-gradient-to-br from-card to-secondary/10">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="font-display">My Classes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {classes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No classes assigned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {classes.map((classInfo) => (
                    <div
                      key={classInfo.id}
                      onClick={() => navigate(`/admin/school/classes/${classInfo.id}/edit`)}
                      className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-background/80 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{classInfo.class_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {classInfo.student_count} students
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          <Card className="border-2 rounded-2xl shadow-lg bg-gradient-to-br from-card to-secondary/10">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <CardTitle className="font-display">Recent Attendance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {recentAttendance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No attendance records yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recentAttendance.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 bg-background/50 rounded-xl border border-border/50 hover:bg-background/80 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{record.student_name}</p>
                          <p className="text-sm text-muted-foreground">{record.class_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(record.date).toLocaleDateString()}
                          </p>
                          {record.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {record.notes}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize whitespace-nowrap ${getStatusBadge(record.status)}`}
                        >
                          {record.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
