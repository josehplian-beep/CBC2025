import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, TrendingUp, Calendar, Clock, Download } from "lucide-react";

interface AttendanceStats {
  totalSessions: number;
  totalCheckins: number;
  avgPerSession: number;
  totalHeadcount: number;
}

interface DailyData {
  date: string;
  checkins: number;
  headcount: number;
}

interface SessionTypeData {
  type: string;
  count: number;
}

const COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#f97316"];

export default function AttendanceDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"week" | "month" | "quarter">("month");
  const [stats, setStats] = useState<AttendanceStats>({
    totalSessions: 0,
    totalCheckins: 0,
    avgPerSession: 0,
    totalHeadcount: 0,
  });
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [sessionTypeData, setSessionTypeData] = useState<SessionTypeData[]>([]);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "week":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "quarter":
        return { start: subDays(now, 90), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const fetchData = async () => {
    try {
      const { start, end } = getDateRange();
      const startStr = format(start, "yyyy-MM-dd");
      const endStr = format(end, "yyyy-MM-dd");

      // Fetch sessions in range
      const { data: sessions, error: sessionsError } = await supabase
        .from("checkin_sessions")
        .select("*")
        .gte("session_date", startStr)
        .lte("session_date", endStr);

      if (sessionsError) throw sessionsError;

      // Fetch check-ins for these sessions
      const sessionIds = sessions?.map(s => s.id) || [];
      let checkins: any[] = [];
      
      if (sessionIds.length > 0) {
        const { data: checkinsData, error: checkinsError } = await supabase
          .from("checkins")
          .select("*")
          .in("session_id", sessionIds);
        
        if (checkinsError) throw checkinsError;
        checkins = checkinsData || [];
      }

      // Calculate stats
      const totalSessions = sessions?.length || 0;
      const totalCheckins = checkins.length;
      const totalHeadcount = sessions?.reduce((sum, s) => sum + (s.headcount || 0), 0) || 0;
      const avgPerSession = totalSessions > 0 ? Math.round(totalCheckins / totalSessions) : 0;

      setStats({ totalSessions, totalCheckins, avgPerSession, totalHeadcount });

      // Calculate daily data
      const days = eachDayOfInterval({ start, end });
      const daily = days.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const daySessions = sessions?.filter(s => s.session_date === dayStr) || [];
        const daySessionIds = daySessions.map(s => s.id);
        const dayCheckins = checkins.filter(c => daySessionIds.includes(c.session_id));
        const dayHeadcount = daySessions.reduce((sum, s) => sum + (s.headcount || 0), 0);
        
        return {
          date: format(day, "MMM d"),
          checkins: dayCheckins.length,
          headcount: dayHeadcount,
        };
      });
      setDailyData(daily);

      // Calculate session type distribution
      const typeMap: Record<string, number> = {};
      sessions?.forEach(s => {
        typeMap[s.session_type] = (typeMap[s.session_type] || 0) + 1;
      });
      const typeData = Object.entries(typeMap).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count,
      }));
      setSessionTypeData(typeData);

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ["Date", "Check-ins", "Headcount"];
    const csvContent = [
      headers.join(","),
      ...dailyData.map(row => `${row.date},${row.checkins},${row.headcount}`),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${dateRange}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  if (loading) {
    return <div className="p-6 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Dashboard</h1>
          <p className="text-muted-foreground">Overview of attendance trends and statistics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCheckins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Session</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPerSession}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Headcount</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHeadcount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="checkins" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Check-ins"
                />
                <Line 
                  type="monotone" 
                  dataKey="headcount" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Headcount"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Session Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Session Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sessionTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="type"
                >
                  {sessionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="checkins" fill="#3b82f6" name="Check-ins" />
              <Bar dataKey="headcount" fill="#22c55e" name="Headcount" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button onClick={() => navigate("/admin/school/checkin")}>
          <Users className="h-4 w-4 mr-2" />
          Manage Check-In Sessions
        </Button>
        <Button variant="outline" onClick={() => navigate("/admin/school/reports")}>
          View Detailed Reports
        </Button>
      </div>
    </div>
  );
}
