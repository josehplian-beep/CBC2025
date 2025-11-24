import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Image, Users, Calendar, MessageSquare, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStatCard } from "@/components/DashboardStatCard";
import { ActivityFeedItem } from "@/components/ActivityFeedItem";
import { DashboardQuickActions } from "@/components/DashboardQuickActions";

interface Stats {
  albums: number;
  photos: number;
  staff: number;
  events: number;
  testimonials: number;
  departments: number;
  members: number;
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
    members: 0,
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
      const [albumsRes, photosRes, staffRes, eventsRes, testimonialsRes, departmentsRes, membersRes] = await Promise.all([
        supabase.from("albums").select("*", { count: "exact", head: true }),
        supabase.from("photos").select("*", { count: "exact", head: true }),
        supabase.from("staff_biographies").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("testimonials").select("*", { count: "exact", head: true }),
        supabase.from("department_members").select("department", { count: "exact" }),
        supabase.from("members").select("*", { count: "exact", head: true }),
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
        members: membersRes.count || 0,
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

  const statCards = [
    { title: "Albums", value: stats.albums, icon: Image, color: "text-blue-500" },
    { title: "Photos", value: stats.photos, icon: Image, color: "text-purple-500" },
    { title: "Staff Members", value: stats.staff, icon: Users, color: "text-green-500" },
    { title: "Members", value: stats.members, icon: Users, color: "text-emerald-500" },
    { title: "Events", value: stats.events, icon: Calendar, color: "text-orange-500" },
    { title: "Testimonies", value: stats.testimonials, icon: MessageSquare, color: "text-pink-500" },
    { title: "Departments", value: stats.departments, icon: Briefcase, color: "text-cyan-500" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8 bg-background min-h-screen">
        {/* Header */}
        <div className="space-y-2 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Overview of your church management system
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-20" />
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
                />
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity - Takes 2 columns */}
          <Card className="overflow-hidden shadow-lg animate-fade-in lg:col-span-2">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
              <CardTitle className="text-xl">Recent Activity</CardTitle>
              <p className="text-sm text-muted-foreground">Latest updates across all sections</p>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No recent activity to display
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
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
    </AdminLayout>
  );
}
