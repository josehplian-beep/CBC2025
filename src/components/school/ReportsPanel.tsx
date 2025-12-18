import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Calendar,
  Users,
  UserCheck,
  UserX,
  Clock,
  Download,
  TrendingUp,
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface Class {
  id: string;
  class_name: string;
  description: string | null;
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

interface Teacher {
  id: string;
  full_name: string;
  photo_url: string | null;
  member_id: string | null;
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  total: number;
}

interface ReportsPanelProps {
  classes: Class[];
  students: Student[];
  teachers: Teacher[];
}

export function ReportsPanel({ classes, students, teachers }: ReportsPanelProps) {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("week");
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
  });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      
      let startDate: Date;
      let endDate = new Date();
      
      switch (dateRange) {
        case "today":
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate = startOfWeek(new Date());
          endDate = endOfWeek(new Date());
          break;
        case "month":
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
          break;
        case "30days":
          startDate = subDays(new Date(), 30);
          break;
        default:
          startDate = subDays(new Date(), 7);
      }

      try {
        // Fetch attendance records
        let query = supabase
          .from("attendance_records")
          .select("*")
          .gte("date", startDate.toISOString().split("T")[0])
          .lte("date", endDate.toISOString().split("T")[0]);

        if (selectedClass !== "all") {
          query = query.eq("class_id", selectedClass);
        }

        const { data: records } = await query;

        if (records) {
          const stats: AttendanceStats = {
            present: records.filter((r) => r.status === "Present").length,
            absent: records.filter((r) => r.status === "Absent").length,
            late: records.filter((r) => r.status === "Late").length,
            total: records.length,
          };
          setAttendanceStats(stats);
        }

        // Fetch recent check-in sessions
        let sessionsQuery = supabase
          .from("checkin_sessions")
          .select("*, classes(class_name)")
          .order("created_at", { ascending: false })
          .limit(10);

        if (selectedClass !== "all") {
          sessionsQuery = sessionsQuery.eq("class_id", selectedClass);
        }

        const { data: sessions } = await sessionsQuery;
        setRecentSessions(sessions || []);
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [selectedClass, dateRange]);

  const attendanceRate =
    attendanceStats.total > 0
      ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100)
      : 0;

  return (
    <div className="p-6 h-[calc(100vh-220px)]">
      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Attendance Reports</h2>
        <div className="flex items-center gap-4">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.class_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{attendanceRate}%</p>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{attendanceStats.present}</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{attendanceStats.late}</p>
                  <p className="text-sm text-muted-foreground">Late</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <UserX className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{attendanceStats.absent}</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <BarChart3 className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{attendanceStats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Sessions */}
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-4">Recent Check-in Sessions</h3>
            {recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No sessions found for the selected period
              </p>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{session.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.classes?.class_name || "No class"} •{" "}
                          {format(new Date(session.session_date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={session.is_active ? "default" : "secondary"}>
                        {session.is_active ? "Active" : "Completed"}
                      </Badge>
                      {session.headcount !== null && (
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {session.headcount}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Stats by Class */}
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-4">Overview by Class</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {classes.map((cls) => (
                <Card key={cls.id} className="p-3 bg-muted/30">
                  <p className="font-medium text-foreground text-sm truncate">{cls.class_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{cls.description || "No description"}</p>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
