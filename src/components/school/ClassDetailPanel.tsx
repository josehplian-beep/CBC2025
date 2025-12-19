import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Users,
  GraduationCap,
  Play,
  Square,
  X,
  UserCheck,
  Clock,
  UserX,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Teacher {
  id: string;
  full_name: string;
  photo_url: string | null;
}

interface Student {
  id: string;
  full_name: string;
  photo_url: string | null;
  date_of_birth: string;
  guardian_name: string;
}

interface Class {
  id: string;
  class_name: string;
  description: string | null;
}

interface AttendanceRecord {
  student_id: string;
  status: "Present" | "Absent" | "Late";
}

interface CheckinSession {
  id: string;
  name: string;
  session_date: string;
  is_active: boolean;
}

interface ClassDetailPanelProps {
  selectedClass: Class | null;
  classTeachers: Teacher[];
  classStudents: Student[];
  allTeachers: Teacher[];
  allStudents: Student[];
  activeSession: CheckinSession | null;
  attendance: AttendanceRecord[];
  onRemoveTeacher: (teacherId: string) => void;
  onRemoveStudent: (studentId: string) => void;
  onAssignTeacher: (teacherId: string) => void;
  onAssignStudent: (studentId: string) => void;
  onStartSession: () => void;
  onEndSession: () => void;
  onAttendanceChange: (studentId: string, status: "Present" | "Absent" | "Late") => void;
}

function DroppableZone({
  id,
  children,
  label,
  icon: Icon,
}: {
  id: string;
  children: React.ReactNode;
  label: string;
  icon: React.ElementType;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border-2 border-dashed p-4 transition-all min-h-[120px]",
        isOver
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border/50 hover:border-border"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      {children}
    </div>
  );
}

export function ClassDetailPanel({
  selectedClass,
  classTeachers,
  classStudents,
  allTeachers,
  allStudents,
  activeSession,
  attendance,
  onRemoveTeacher,
  onRemoveStudent,
  onAssignTeacher,
  onAssignStudent,
  onStartSession,
  onEndSession,
  onAttendanceChange,
}: ClassDetailPanelProps) {
  const [teacherSearch, setTeacherSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [teacherPopoverOpen, setTeacherPopoverOpen] = useState(false);
  const [studentPopoverOpen, setStudentPopoverOpen] = useState(false);

  const availableTeachers = allTeachers.filter(
    (t) => !classTeachers.some((ct) => ct.id === t.id) &&
      t.full_name.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const availableStudents = allStudents.filter(
    (s) => !classStudents.some((cs) => cs.id === s.id) &&
      s.full_name.toLowerCase().includes(studentSearch.toLowerCase())
  );
  if (!selectedClass) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-lg font-medium text-muted-foreground">Select a Class</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Choose a class from the left panel to view details
          </p>
        </div>
      </div>
    );
  }

  const getAttendanceStats = () => {
    const present = attendance.filter((a) => a.status === "Present").length;
    const late = attendance.filter((a) => a.status === "Late").length;
    const absent = attendance.filter((a) => a.status === "Absent").length;
    const unmarked = classStudents.length - attendance.length;
    return { present, late, absent, unmarked };
  };

  const stats = getAttendanceStats();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Class Header */}
      <div className="p-6 border-b bg-card/30">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{selectedClass.class_name}</h2>
            {selectedClass.description && (
              <p className="text-sm text-muted-foreground mt-1">{selectedClass.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {!activeSession ? (
              <Button onClick={onStartSession} className="gap-2">
                <Play className="h-4 w-4" />
                Start Check-in
              </Button>
            ) : (
              <Button onClick={onEndSession} variant="destructive" className="gap-2">
                <Square className="h-4 w-4" />
                End Session
              </Button>
            )}
          </div>
        </div>

        {activeSession && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Session Active
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">
                  <UserCheck className="inline h-4 w-4 mr-1" />
                  {stats.present} Present
                </span>
                <span className="text-yellow-600">
                  <Clock className="inline h-4 w-4 mr-1" />
                  {stats.late} Late
                </span>
                <span className="text-red-600">
                  <UserX className="inline h-4 w-4 mr-1" />
                  {stats.absent} Absent
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {/* Teachers Section */}
          <DroppableZone id="teachers-drop-zone" label="Assigned Teachers" icon={Users}>
            <div className="flex flex-wrap gap-2 items-center">
              {classTeachers.map((teacher) => (
                <Badge
                  key={teacher.id}
                  variant="secondary"
                  className="pl-1 pr-1 py-1 gap-2 text-sm"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={teacher.photo_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {teacher.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{teacher.full_name}</span>
                  <button
                    onClick={() => onRemoveTeacher(teacher.id)}
                    className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Popover open={teacherPopoverOpen} onOpenChange={setTeacherPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Plus className="h-4 w-4" />
                    Add Teacher
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search teachers..."
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        className="pl-8 h-9"
                      />
                    </div>
                    <ScrollArea className="h-[200px]">
                      {availableTeachers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {teacherSearch ? "No teachers found" : "All teachers assigned"}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {availableTeachers.map((teacher) => (
                            <button
                              key={teacher.id}
                              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted text-left"
                              onClick={() => {
                                onAssignTeacher(teacher.id);
                                setTeacherPopoverOpen(false);
                                setTeacherSearch("");
                              }}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={teacher.photo_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {teacher.full_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{teacher.full_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </DroppableZone>

          {/* Students Section */}
          <DroppableZone id="students-drop-zone" label="Enrolled Students" icon={GraduationCap}>
            <div className="space-y-2">
              {classStudents.map((student) => {
                const attendanceRecord = attendance.find((a) => a.student_id === student.id);
                const currentStatus = attendanceRecord?.status;

                return (
                  <Card
                    key={student.id}
                    className="p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.photo_url || undefined} />
                        <AvatarFallback>{student.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Guardian: {student.guardian_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeSession && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={currentStatus === "Present" ? "default" : "outline"}
                            className={cn(
                              "h-8 px-3",
                              currentStatus === "Present" &&
                                "bg-green-600 hover:bg-green-700 text-white"
                            )}
                            onClick={() => onAttendanceChange(student.id, "Present")}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={currentStatus === "Late" ? "default" : "outline"}
                            className={cn(
                              "h-8 px-3",
                              currentStatus === "Late" &&
                                "bg-yellow-600 hover:bg-yellow-700 text-white"
                            )}
                            onClick={() => onAttendanceChange(student.id, "Late")}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={currentStatus === "Absent" ? "default" : "outline"}
                            className={cn(
                              "h-8 px-3",
                              currentStatus === "Absent" &&
                                "bg-red-600 hover:bg-red-700 text-white"
                            )}
                            onClick={() => onAttendanceChange(student.id, "Absent")}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveStudent(student.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
              <Popover open={studentPopoverOpen} onOpenChange={setStudentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1 mt-2">
                    <Plus className="h-4 w-4" />
                    Add Student
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-8 h-9"
                      />
                    </div>
                    <ScrollArea className="h-[200px]">
                      {availableStudents.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {studentSearch ? "No students found" : "All students enrolled"}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {availableStudents.map((student) => (
                            <button
                              key={student.id}
                              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted text-left"
                              onClick={() => {
                                onAssignStudent(student.id);
                                setStudentPopoverOpen(false);
                                setStudentSearch("");
                              }}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={student.photo_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {student.full_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{student.full_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </DroppableZone>

          {/* Attendance Report */}
          {activeSession && attendance.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Attendance Report</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                  <p className="text-sm text-green-600">Present</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                  <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                  <p className="text-sm text-yellow-600">Late</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10">
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                  <p className="text-sm text-red-600">Absent</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  Attendance Rate:{" "}
                  <span className="font-medium text-foreground">
                    {classStudents.length > 0
                      ? Math.round(((stats.present + stats.late) / classStudents.length) * 100)
                      : 0}
                    %
                  </span>
                </p>
                <p>
                  Date: <span className="font-medium text-foreground">{new Date().toLocaleDateString()}</span>
                </p>
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
