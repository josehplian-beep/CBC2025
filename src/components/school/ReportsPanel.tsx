import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, CalendarDays } from "lucide-react";
import { SundayAttendanceOverview } from "./SundayAttendanceOverview";
import { AttendanceSummaryReports } from "./AttendanceSummaryReports";

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

interface ReportsPanelProps {
  classes: Class[];
  students: Student[];
  teachers: Teacher[];
}

export function ReportsPanel({ classes, students, teachers }: ReportsPanelProps) {
  return (
    <div className="p-4 md:p-6 h-[calc(100vh-220px)]">
      <Tabs defaultValue="today" className="h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Attendance Reports</h2>
          <TabsList>
            <TabsTrigger value="today" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Today</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="today" className="mt-0 h-[calc(100%-60px)] overflow-auto">
          <SundayAttendanceOverview />
        </TabsContent>

        <TabsContent value="summary" className="mt-0 h-[calc(100%-60px)] overflow-auto">
          <AttendanceSummaryReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
