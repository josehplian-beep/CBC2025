import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Image, Users, Calendar, MessageSquare, FileText, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface Stats {
  albums: number;
  photos: number;
  staff: number;
  events: number;
  testimonials: number;
  departments: number;
}

interface RecentItem {
  id: string;
  title: string;
  created_at: string;
  type: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    albums: 0,
    photos: 0,
    staff: 0,
    events: 0,
    testimonials: 0,
    departments: 0,
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
      const [albumsRes, photosRes, staffRes, eventsRes, testimonialsRes, departmentsRes] = await Promise.all([
        supabase.from("albums").select("*", { count: "exact", head: true }),
        supabase.from("photos").select("*", { count: "exact", head: true }),
        supabase.from("staff_biographies").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("testimonials").select("*", { count: "exact", head: true }),
        supabase.from("department_members").select("department", { count: "exact" }),
      ]);

      // Get unique department count
      const uniqueDepartments = new Set(departmentsRes.data?.map(d => d.department) || []);

      setStats({
        albums: albumsRes.count || 0,
        photos: photosRes.count || 0,
        staff: staffRes.count || 0,
        events: eventsRes.count || 0,
        testimonials: testimonialsRes.count || 0,
        departments: uniqueDepartments.size,
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
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "album":
        return <Image className="h-4 w-4 text-muted-foreground" />;
      case "event":
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
      case "testimonial":
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityLink = (item: RecentItem) => {
    switch (item.type) {
      case "album":
        return `/admin/albums`;
      case "event":
        return `/events`;
      case "testimonial":
        return `/testimonials`;
      default:
        return "#";
    }
  };

  const statCards = [
    { title: "Albums", value: stats.albums, icon: Image, color: "text-blue-500" },
    { title: "Photos", value: stats.photos, icon: Image, color: "text-purple-500" },
    { title: "Staff Members", value: stats.staff, icon: Users, color: "text-green-500" },
    { title: "Events", value: stats.events, icon: Calendar, color: "text-orange-500" },
    { title: "Testimonials", value: stats.testimonials, icon: MessageSquare, color: "text-pink-500" },
    { title: "Departments", value: stats.departments, icon: Briefcase, color: "text-cyan-500" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your church management system</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))
            : statCards.map((stat, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Latest updates across all sections</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity to display
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <Link
                    key={item.id}
                    to={getActivityLink(item)}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded bg-muted">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")} • {item.type}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
