/**
 * AttendanceSummaryReports
 * 
 * Monthly and yearly attendance summaries with export functionality
 * Calendar month-based reporting
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  BarChart3,
  Users,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  getYear,
  getMonth,
} from "date-fns";

interface MonthlySummary {
  month: string;
  year: number;
  monthNum: number;
  totalRecords: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

interface ClassSummary {
  id: string;
  class_name: string;
  totalRecords: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

interface StudentSummary {
  id: string;
  full_name: string;
  className: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];

export function AttendanceSummaryReports() {
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonth(new Date()));
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [reportType, setReportType] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(true);
  
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [classSummaries, setClassSummaries] = useState<ClassSummary[]>([]);
  const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalRecords: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0,
    uniqueStudents: 0,
    daysWithAttendance: 0,
  });

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, selectedYear, reportType]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;

      if (reportType === "monthly") {
        startDate = startOfMonth(new Date(selectedYear, selectedMonth));
        endDate = endOfMonth(new Date(selectedYear, selectedMonth));
      } else {
        startDate = startOfYear(new Date(selectedYear, 0));
        endDate = endOfYear(new Date(selectedYear, 0));
      }

      // Fetch all attendance records in range
      const { data: records } = await supabase
        .from("attendance_records")
        .select("*, students(id, full_name), classes(id, class_name)")
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (!records) {
        setLoading(false);
        return;
      }

      // Calculate overall stats
      const present = records.filter((r) => r.status === "Present").length;
      const absent = records.filter((r) => r.status === "Absent").length;
      const late = records.filter((r) => r.status === "Late").length;
      const uniqueStudents = new Set(records.map((r) => r.student_id)).size;
      const uniqueDates = new Set(records.map((r) => r.date)).size;
      const attendanceRate = records.length > 0 
        ? Math.round(((present + late) / records.length) * 100) 
        : 0;

      setOverallStats({
        totalRecords: records.length,
        present,
        absent,
        late,
        attendanceRate,
        uniqueStudents,
        daysWithAttendance: uniqueDates,
      });

      // Calculate monthly summaries for yearly view
      if (reportType === "yearly") {
        const monthlyData = eachMonthOfInterval({ start: startDate, end: endDate }).map((date) => {
          const monthRecords = records.filter((r) => {
            const recordDate = new Date(r.date);
            return getMonth(recordDate) === getMonth(date) && getYear(recordDate) === getYear(date);
          });
          
          const monthPresent = monthRecords.filter((r) => r.status === "Present").length;
          const monthAbsent = monthRecords.filter((r) => r.status === "Absent").length;
          const monthLate = monthRecords.filter((r) => r.status === "Late").length;
          
          return {
            month: format(date, "MMMM"),
            year: getYear(date),
            monthNum: getMonth(date),
            totalRecords: monthRecords.length,
            present: monthPresent,
            absent: monthAbsent,
            late: monthLate,
            attendanceRate: monthRecords.length > 0 
              ? Math.round(((monthPresent + monthLate) / monthRecords.length) * 100) 
              : 0,
          };
        });
        setMonthlySummaries(monthlyData);
      }

      // Calculate class summaries
      const classMap = new Map<string, ClassSummary>();
      records.forEach((r) => {
        if (!r.classes) return;
        const key = r.classes.id;
        if (!classMap.has(key)) {
          classMap.set(key, {
            id: key,
            class_name: r.classes.class_name,
            totalRecords: 0,
            present: 0,
            absent: 0,
            late: 0,
            attendanceRate: 0,
          });
        }
        const cls = classMap.get(key)!;
        cls.totalRecords++;
        if (r.status === "Present") cls.present++;
        if (r.status === "Absent") cls.absent++;
        if (r.status === "Late") cls.late++;
      });
      
      const classSummaryArray = Array.from(classMap.values()).map((cls) => ({
        ...cls,
        attendanceRate: cls.totalRecords > 0 
          ? Math.round(((cls.present + cls.late) / cls.totalRecords) * 100) 
          : 0,
      }));
      setClassSummaries(classSummaryArray.sort((a, b) => b.attendanceRate - a.attendanceRate));

      // Calculate student summaries
      const studentMap = new Map<string, StudentSummary>();
      records.forEach((r) => {
        if (!r.students) return;
        const key = r.students.id;
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            id: key,
            full_name: r.students.full_name,
            className: r.classes?.class_name || "Unknown",
            totalDays: 0,
            present: 0,
            absent: 0,
            late: 0,
            attendanceRate: 0,
          });
        }
        const student = studentMap.get(key)!;
        student.totalDays++;
        if (r.status === "Present") student.present++;
        if (r.status === "Absent") student.absent++;
        if (r.status === "Late") student.late++;
      });
      
      const studentSummaryArray = Array.from(studentMap.values()).map((s) => ({
        ...s,
        attendanceRate: s.totalDays > 0 
          ? Math.round(((s.present + s.late) / s.totalDays) * 100) 
          : 0,
      }));
      setStudentSummaries(studentSummaryArray.sort((a, b) => a.full_name.localeCompare(b.full_name)));

    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const reportPeriod = reportType === "monthly" 
      ? `${months[selectedMonth]}_${selectedYear}` 
      : `${selectedYear}`;

    // Export student summary
    const headers = ["Student Name", "Class", "Total Days", "Present", "Late", "Absent", "Attendance Rate"];
    const rows = studentSummaries.map((s) => [
      s.full_name,
      s.className,
      s.totalDays,
      s.present,
      s.late,
      s.absent,
      `${s.attendanceRate}%`,
    ]);

    const csvContent = [
      `Attendance Report - ${reportType === "monthly" ? months[selectedMonth] + " " : ""}${selectedYear}`,
      "",
      `Overall Attendance Rate: ${overallStats.attendanceRate}%`,
      `Total Records: ${overallStats.totalRecords}`,
      `Unique Students: ${overallStats.uniqueStudents}`,
      "",
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${reportPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Tabs value={reportType} onValueChange={(v) => setReportType(v as "monthly" | "yearly")}>
            <TabsList>
              <TabsTrigger value="monthly" className="gap-2">
                <Calendar className="h-4 w-4" />
                Monthly
              </TabsTrigger>
              <TabsTrigger value="yearly" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Yearly
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {reportType === "monthly" && (
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={month} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExportCSV} disabled={studentSummaries.length === 0} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-primary">
                {overallStats.attendanceRate}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Attendance Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {overallStats.present}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Present</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <span className="text-2xl font-bold text-amber-600">
                {overallStats.late}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Late</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                {overallStats.absent}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Absent</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-foreground" />
              <span className="text-2xl font-bold">{overallStats.uniqueStudents}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Students</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-foreground" />
              <span className="text-2xl font-bold">{overallStats.daysWithAttendance}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Days Recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Yearly Monthly Breakdown */}
      {reportType === "yearly" && monthlySummaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Monthly Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {monthlySummaries.map((month) => (
                <div
                  key={month.monthNum}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <p className="font-medium text-sm text-foreground">{month.month}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-primary">
                      {month.attendanceRate}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {month.totalRecords} records
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Class Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Summary by Class</CardTitle>
        </CardHeader>
        <CardContent>
          {classSummaries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No attendance data for this period
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {classSummaries.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-foreground">{cls.class_name}</p>
                    <Badge
                      variant="outline"
                      className={
                        cls.attendanceRate >= 90
                          ? "text-green-600 border-green-300"
                          : cls.attendanceRate >= 75
                          ? "text-amber-600 border-amber-300"
                          : "text-red-600 border-red-300"
                      }
                    >
                      {cls.attendanceRate}%
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="text-green-600">{cls.present} present</span>
                    <span className="text-amber-600">{cls.late} late</span>
                    <span className="text-red-600">{cls.absent} absent</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Student Attendance Details</CardTitle>
        </CardHeader>
        <CardContent>
          {studentSummaries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No student attendance data for this period
            </p>
          ) : (
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {studentSummaries.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground">{student.className}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex gap-3 text-xs">
                          <span className="text-green-600">{student.present}P</span>
                          <span className="text-amber-600">{student.late}L</span>
                          <span className="text-red-600">{student.absent}A</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {student.totalDays} days
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          student.attendanceRate >= 90
                            ? "text-green-600 border-green-300 min-w-[52px] justify-center"
                            : student.attendanceRate >= 75
                            ? "text-amber-600 border-amber-300 min-w-[52px] justify-center"
                            : "text-red-600 border-red-300 min-w-[52px] justify-center"
                        }
                      >
                        {student.attendanceRate}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
