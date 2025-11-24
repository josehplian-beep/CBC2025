import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Calendar, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

interface Class {
  id: string;
  class_name: string;
}

export default function AdminSchoolReports() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    classId: "",
    startDate: "",
    endDate: "",
    status: ""
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [filters]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("id, class_name")
        .order("class_name");

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load classes");
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      let query = supabase
        .from("attendance_records")
        .select("*, students(full_name), classes(class_name)")
        .order("date", { ascending: false });

      if (filters.classId) {
        query = query.eq("class_id", filters.classId);
      }
      if (filters.startDate) {
        query = query.gte("date", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("date", filters.endDate);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Student", "Class", "Status"];
    const rows = records.map(record => [
      record.date,
      record.students?.full_name || "Unknown",
      record.classes?.class_name || "Unknown",
      record.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "destructive" | "outline" | "secondary"; className: string }> = {
      Present: { variant: "default", className: "bg-green-500" },
      Absent: { variant: "destructive", className: "" },
      Late: { variant: "secondary", className: "bg-yellow-500" },
      Excused: { variant: "outline", className: "" }
    };

    const config = variants[status] || variants.Present;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const calculateStats = () => {
    const total = records.length;
    const present = records.filter(r => r.status === "Present").length;
    const absent = records.filter(r => r.status === "Absent").length;
    const late = records.filter(r => r.status === "Late").length;
    const excused = records.filter(r => r.status === "Excused").length;
    const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(1) : "0";

    return { total, present, absent, late, excused, attendanceRate };
  };

  const stats = calculateStats();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Attendance Reports</h1>
            <p className="text-muted-foreground">View and analyze attendance data</p>
          </div>
          <Button onClick={handleExportCSV} disabled={records.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                {stats.attendanceRate}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select
                  value={filters.classId}
                  onValueChange={(value) => setFilters({ ...filters, classId: value })}
                >
                  <SelectTrigger id="class">
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="Present">Present</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                    <SelectItem value="Late">Late</SelectItem>
                    <SelectItem value="Excused">Excused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>All attendance records matching your filters</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.students?.full_name || "Unknown"}</TableCell>
                      <TableCell>{record.classes?.class_name || "Unknown"}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
