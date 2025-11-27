import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Image, Users, Calendar, MessageSquare, Briefcase, BookOpen, UserCheck, Heart, GraduationCap, UserCog, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStatCard } from "@/components/DashboardStatCard";
import { ActivityFeedItem } from "@/components/ActivityFeedItem";
import { DashboardQuickActions } from "@/components/DashboardQuickActions";
import { usePermissions } from "@/hooks/usePermissions";

interface Stats {
  albums: number;
  photos: number;
  staff: number;
  events: number;
  testimonials: number;
  departments: number;
  members: number;
  prayerRequests: number;
  students: number;
  classes: number;
  teachers: number;
  upcomingEvents: number;
}

interface RecentItem {
  id: string;
  title: string;
  created_at: string;
  type: string;
}

export default function AdminDashboard() {
  const { role, can, isAdministrator, isStaff, isEditor, isTeacher } = usePermissions();
  const [stats, setStats] = useState<Stats>({
    albums: 0,
    photos: 0,
    staff: 0,
    events: 0,
    testimonials: 0,
    departments: 0,
    members: 0,
    prayerRequests: 0,
    students: 0,
    classes: 0,
    teachers: 0,
    upcomingEvents: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch counts for all entities
      const [
        albumsRes, 
        photosRes, 
        staffRes, 
        eventsRes, 
        testimonialsRes, 
        departmentsRes, 
        membersRes,
        prayerRequestsRes,
        studentsRes,
        classesRes,
        teachersRes
      ] = await Promise.all([
        supabase.from("albums").select("*", { count: "exact", head: true }),
        supabase.from("photos").select("*", { count: "exact", head: true }),
        supabase.from("staff_biographies").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("testimonials").select("*", { count: "exact", head: true }),
        supabase.from("department_members").select("department", { count: "exact" }),
        supabase.from("members").select("*", { count: "exact", head: true }),
        supabase.from("prayer_requests").select("*", { count: "exact", head: true }),
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("teachers").select("*", { count: "exact", head: true }),
      ]);

      // Get unique department count
      const uniqueDepartments = new Set(departmentsRes.data?.map(d => d.department) || []);

      // Get upcoming events count
      const today = new Date().toISOString();
      const { count: upcomingCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .gte("date_obj", today);

      setStats({
        albums: albumsRes.count || 0,
        photos: photosRes.count || 0,
        staff: staffRes.count || 0,
        events: eventsRes.count || 0,
        testimonials: testimonialsRes.count || 0,
        departments: uniqueDepartments.size,
        members: membersRes.count || 0,
        prayerRequests: prayerRequestsRes.count || 0,
        students: studentsRes.count || 0,
        classes: classesRes.count || 0,
        teachers: teachersRes.count || 0,
        upcomingEvents: upcomingCount || 0,
      });

      // Fetch recent activity from multiple tables
      const [recentAlbums, recentEvents, recentTestimonials] = await Promise.all([
        supabase
          .from("albums")
          .select("id, title, created_at")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("events")
          .select("id, title, created_at")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("testimonials")
          .select("id, title, created_at")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      // Combine and sort all recent items
      const allRecent: RecentItem[] = [
        ...(recentAlbums.data?.map(item => ({ ...item, type: "album" })) || []),
        ...(recentEvents.data?.map(item => ({ ...item, type: "event" })) || []),
        ...(recentTestimonials.data?.map(item => ({ ...item, type: "testimonial" })) || []),
      ];

      allRecent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRecentActivity(allRecent.slice(0, 8));
    } catch (error) {
      // Silently handle fetch error
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "album":
        return Image;
      case "event":
        return Calendar;
      case "testimonial":
        return MessageSquare;
      default:
        return MessageSquare;
    }
  };

  const getActivityLink = (item: RecentItem) => {
    switch (item.type) {
      case "album":
        return `/admin/albums`;
      case "event":
        return `/events`;
      case "testimonial":
        return `/testimony`;
      default:
        return "#";
    }
  };

  // Role-based stat cards with links
  const getStatCards = () => {
    const allCards = [
      { 
        title: "Total Members", 
        value: stats.members, 
        icon: Users, 
        color: "text-primary", 
        link: "/members",
        roles: ['administrator', 'editor', 'staff'] 
      },
      { 
        title: "Upcoming Events", 
        value: stats.upcomingEvents, 
        icon: Calendar, 
        color: "text-accent", 
        link: "/admin/events",
        roles: ['administrator', 'editor'] 
      },
      { 
        title: "Prayer Requests", 
        value: stats.prayerRequests, 
        icon: Heart, 
        color: "text-destructive", 
        link: "/admin/prayer-requests",
        roles: ['administrator', 'staff'] 
      },
      { 
        title: "Photo Albums", 
        value: stats.albums, 
        icon: Image, 
        color: "text-primary", 
        link: "/admin/albums",
        roles: ['administrator', 'editor'] 
      },
      { 
        title: "Total Photos", 
        value: stats.photos, 
        icon: Image, 
        color: "text-accent", 
        link: "/admin/albums",
        roles: ['administrator', 'editor'] 
      },
      { 
        title: "Staff Members", 
        value: stats.staff, 
        icon: UserCog, 
        color: "text-primary", 
        link: "/admin/staff",
        roles: ['administrator', 'editor', 'staff'] 
      },
      { 
        title: "All Events", 
        value: stats.events, 
        icon: Calendar, 
        color: "text-accent", 
        link: "/admin/events",
        roles: ['administrator', 'editor'] 
      },
      { 
        title: "Testimonials", 
        value: stats.testimonials, 
        icon: MessageSquare, 
        color: "text-primary", 
        link: "/admin/testimonials",
        roles: ['administrator', 'editor'] 
      },
      { 
        title: "Departments", 
        value: stats.departments, 
        icon: Briefcase, 
        color: "text-accent", 
        link: "/admin/departments",
        roles: ['administrator', 'editor', 'staff'] 
      },
    ];

    // Filter cards based on user role
    if (isTeacher) {
      return [
        { 
          title: "My Classes", 
          value: stats.classes, 
          icon: BookOpen, 
          color: "text-primary",
          link: "/admin/school/classes"
        },
        { 
          title: "Total Students", 
          value: stats.students, 
          icon: GraduationCap, 
          color: "text-accent",
          link: "/admin/school/students"
        },
        { 
          title: "Teachers", 
          value: stats.teachers, 
          icon: UserCheck, 
          color: "text-primary",
          link: "/admin/school/teachers"
        },
      ];
    }

    return allCards.filter(card => !card.roles || card.roles.includes(role || ''));
  };

  const statCards = getStatCards();

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-background">
      {/* Modern Gradient Header */}
      <div className="bg-gradient-to-r from-primary via-accent to-primary p-8 mb-6 rounded-b-2xl shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold text-primary-foreground tracking-tight">
                  {isTeacher ? "Teacher Dashboard" : isEditor ? "Content Dashboard" : isStaff ? "Staff Dashboard" : "Admin Dashboard"}
                </h1>
                <p className="text-primary-foreground/80 text-lg mt-1">
                  {isTeacher 
                    ? "Manage your classes and students" 
                    : isEditor 
                    ? "Manage content and media" 
                    : isStaff 
                    ? "Manage members and church operations"
                    : "Overview of your church management system"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-8 pb-8">

        {/* Stats Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 9 }).map((_, i) => (
                <Card key={i} className="animate-pulse border-2 rounded-2xl">
                  <div className="h-1 bg-gradient-to-r from-primary to-accent"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-12 rounded-xl" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-4 w-20 mt-3" />
                  </CardContent>
                </Card>
              ))
            : statCards.map((stat, index) => (
                <DashboardStatCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  iconColor={stat.color}
                  link={stat.link}
                />
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity - Takes 2 columns */}
          <Card className="overflow-hidden border-2 rounded-2xl shadow-lg animate-fade-in lg:col-span-2 bg-gradient-to-br from-card to-secondary/20">
            <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
              <CardTitle className="text-2xl font-display flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Recent Activity
              </CardTitle>
              <p className="text-sm text-muted-foreground">Latest updates across all sections</p>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                    <MessageSquare className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-lg text-muted-foreground">
                    No recent activity to display
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((item) => (
                    <ActivityFeedItem
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      created_at={item.created_at}
                      type={item.type}
                      icon={getActivityIcon(item.type)}
                      link={getActivityLink(item)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions - Takes 1 column */}
          <DashboardQuickActions />
        </div>
      </div>
    </div>
  );
}
