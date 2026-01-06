/**
 * SundayAttendanceOverview
 * 
 * Shows all classes with their completion status for today
 * Uses status chips (Done/Pending/Not Started)
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  Circle,
  Users,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassStatus {
  id: string;
  class_name: string;
  description: string | null;
  studentCount: number;
  markedCount: number;
  status: "done" | "pending" | "not_started";
}

interface OverviewStats {
  totalClasses: number;
  completedClasses: number;
  totalStudents: number;
  markedStudents: number;
}

export function SundayAttendanceOverview() {
  const [classStatuses, setClassStatuses] = useState<ClassStatus[]>([]);
  const [stats, setStats] = useState<OverviewStats>({
    totalClasses: 0,
    completedClasses: 0,
    totalStudents: 0,
    markedStudents: 0,
  });
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];
  const isSunday = new Date().getDay() === 0;

  useEffect(() => {
    fetchClassStatuses();
  }, []);

  const fetchClassStatuses = async () => {
    try {
      // Fetch all classes
      const { data: classes } = await supabase
        .from("classes")
        .select("id, class_name, description")
        .order("class_name");

      if (!classes) return;

      const statuses: ClassStatus[] = [];
      let totalStudents = 0;
      let markedStudents = 0;
      let completedClasses = 0;

      for (const cls of classes) {
        // Get student count for this class
        const { count: studentCount } = await supabase
          .from("student_classes")
          .select("*", { count: "exact", head: true })
          .eq("class_id", cls.id);

        // Get attendance count for today
        const { count: attendanceCount } = await supabase
          .from("attendance_records")
          .select("*", { count: "exact", head: true })
          .eq("class_id", cls.id)
          .eq("date", today);

        const students = studentCount || 0;
        const marked = attendanceCount || 0;

        totalStudents += students;
        markedStudents += marked;

        let status: ClassStatus["status"] = "not_started";
        if (students > 0 && marked === students) {
          status = "done";
          completedClasses++;
        } else if (marked > 0) {
          status = "pending";
        }

        statuses.push({
          id: cls.id,
          class_name: cls.class_name,
          description: cls.description,
          studentCount: students,
          markedCount: marked,
          status,
        });
      }

      setClassStatuses(statuses);
      setStats({
        totalClasses: classes.length,
        completedClasses,
        totalStudents,
        markedStudents,
      });
    } catch (error) {
      console.error("Error fetching class statuses:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ClassStatus["status"]) => {
    switch (status) {
      case "done":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1">
            <Circle className="h-3 w-3" />
            Not Started
          </Badge>
        );
    }
  };

  const completionPercentage =
    stats.totalStudents > 0
      ? Math.round((stats.markedStudents / stats.totalStudents) * 100)
      : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Today's Attendance Overview
          </CardTitle>
          {isSunday && (
            <Badge className="bg-primary/10 text-primary">
              Sunday Service
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Completion</span>
            <span className="font-semibold text-foreground">
              {stats.completedClasses}/{stats.totalClasses} classes
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{stats.markedStudents} students marked</span>
            <span>{completionPercentage}% complete</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                {classStatuses.filter((c) => c.status === "done").length}
              </span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">Done</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {classStatuses.filter((c) => c.status === "pending").length}
              </span>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Pending</p>
          </div>
          <div className="p-3 rounded-lg bg-muted border border-border">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold text-foreground">
                {classStatuses.filter((c) => c.status === "not_started").length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Not Started</p>
          </div>
        </div>

        {/* Class List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {classStatuses.map((cls) => (
            <div
              key={cls.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-colors",
                cls.status === "done" && "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50",
                cls.status === "pending" && "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50",
                cls.status === "not_started" && "bg-card border-border"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {cls.class_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cls.markedCount}/{cls.studentCount} students
                    </p>
                  </div>
                </div>
              </div>
              {getStatusBadge(cls.status)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
