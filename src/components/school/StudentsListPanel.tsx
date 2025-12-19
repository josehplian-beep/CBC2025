import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Trash2, ExternalLink, Filter, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInYears } from "date-fns";
import { AddStudentDialog } from "./AddStudentDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

interface Student {
  id: string;
  full_name: string;
  photo_url: string | null;
  date_of_birth: string;
  guardian_name: string;
  guardian_phone: string;
  member_id: string | null;
}

interface Class {
  id: string;
  class_name: string;
  description: string | null;
}

interface Member {
  id: string;
  gender: string | null;
}

interface StudentsListPanelProps {
  students: Student[];
  classes: Class[];
  onRefresh: () => void;
}

function StudentCard({
  student,
  classNames,
  age,
  gender,
  isAdmin,
  onDelete,
  onViewProfile,
}: {
  student: Student;
  classNames: string[];
  age: number | null;
  gender: string | null;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onViewProfile: (memberId: string) => void;
}) {
  return (
    <Card className="p-4 transition-all hover:shadow-md hover:border-border">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={student.photo_url || undefined} />
          <AvatarFallback className={cn(
            "text-white",
            gender === "Female" ? "bg-pink-500" : gender === "Male" ? "bg-blue-500" : "bg-green-500"
          )}>
            {student.full_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {student.member_id ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile(student.member_id!);
              }}
              className="font-medium text-foreground truncate hover:text-primary hover:underline transition-colors flex items-center gap-1 text-left"
            >
              {student.full_name}
              <ExternalLink className="h-3 w-3 opacity-50" />
            </button>
          ) : (
            <p className="font-medium text-foreground truncate">{student.full_name}</p>
          )}
          <p className="text-sm text-muted-foreground truncate">
            {age ? `Age ${age}` : ""}{gender ? ` • ${gender}` : ""}{student.guardian_name ? ` • ${student.guardian_name}` : ""}
          </p>
          {classNames.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {classNames.map((className) => (
                <Badge key={className} variant="secondary" className="text-xs">
                  {className}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(student.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

export function StudentsListPanel({ students, classes, onRefresh }: StudentsListPanelProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [studentClasses, setStudentClasses] = useState<Record<string, string[]>>({});
  const [studentGenders, setStudentGenders] = useState<Record<string, string | null>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const { isAdministrator } = usePermissions();

  const handleViewProfile = (memberId: string) => {
    navigate(`/members/${memberId}`);
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      // Fetch student classes
      const { data: classData } = await supabase
        .from("student_classes")
        .select("student_id, class_id");

      if (classData) {
        const mapping: Record<string, string[]> = {};
        classData.forEach((item) => {
          if (!mapping[item.student_id]) {
            mapping[item.student_id] = [];
          }
          mapping[item.student_id].push(item.class_id);
        });
        setStudentClasses(mapping);
      }

      // Fetch member genders for linked students
      const memberIds = students.filter(s => s.member_id).map(s => s.member_id);
      if (memberIds.length > 0) {
        const { data: memberData } = await supabase
          .from("members")
          .select("id, gender")
          .in("id", memberIds);

        if (memberData) {
          const genderMapping: Record<string, string | null> = {};
          students.forEach((student) => {
            if (student.member_id) {
              const member = memberData.find(m => m.id === student.member_id);
              genderMapping[student.id] = member?.gender || null;
            }
          });
          setStudentGenders(genderMapping);
        }
      }
    };

    fetchStudentData();
  }, [students]);

  const filteredStudents = students.filter((s) => {
    // Search filter
    const matchesSearch = 
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.guardian_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Class filter
    const matchesClass = selectedClass === "all" || 
      (studentClasses[s.id] && studentClasses[s.id].includes(selectedClass));
    
    // Gender filter
    const studentGender = studentGenders[s.id];
    const matchesGender = selectedGender === "all" || studentGender === selectedGender;
    
    return matchesSearch && matchesClass && matchesGender;
  });

  const getClassNames = (studentId: string) => {
    const classIds = studentClasses[studentId] || [];
    return classes
      .filter((c) => classIds.includes(c.id))
      .map((c) => c.class_name);
  };

  const getAge = (dateOfBirth: string) => {
    try {
      return differenceInYears(new Date(), new Date(dateOfBirth));
    } catch {
      return null;
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudentId) return;
    
    setDeleting(true);
    try {
      // Remove from all class enrollments
      await supabase
        .from("student_classes")
        .delete()
        .eq("student_id", deleteStudentId);

      // Remove attendance records
      await supabase
        .from("attendance_records")
        .delete()
        .eq("student_id", deleteStudentId);

      // Remove checkins
      await supabase
        .from("checkins")
        .delete()
        .eq("student_id", deleteStudentId);

      // Remove child info if exists
      await supabase
        .from("child_info")
        .delete()
        .eq("student_id", deleteStudentId);

      // Delete the student
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", deleteStudentId);

      if (error) throw error;
      
      toast.success("Student deleted successfully");
      onRefresh();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    } finally {
      setDeleting(false);
      setDeleteStudentId(null);
    }
  };

  const studentToDelete = deleteStudentId 
    ? students.find((s) => s.id === deleteStudentId) 
    : null;

  // Count students per filter
  const maleCount = students.filter(s => studentGenders[s.id] === "Male").length;
  const femaleCount = students.filter(s => studentGenders[s.id] === "Female").length;

  return (
    <div className="flex-1 p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">All Students</h2>
            <Badge variant="secondary" className="ml-2">
              {filteredStudents.length} of {students.length}
            </Badge>
          </div>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Student
          </Button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filters:</span>
          </div>
          
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Classes" />
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

          <Select value={selectedGender} onValueChange={setSelectedGender}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Genders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="Male">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Male ({maleCount})
                </span>
              </SelectItem>
              <SelectItem value="Female">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  Female ({femaleCount})
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {(selectedClass !== "all" || selectedGender !== "all" || searchQuery) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSelectedClass("all");
                setSelectedGender("all");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              classNames={getClassNames(student.id)}
              age={getAge(student.date_of_birth)}
              gender={studentGenders[student.id] || null}
              isAdmin={isAdministrator}
              onDelete={setDeleteStudentId}
              onViewProfile={handleViewProfile}
            />
          ))}
        </div>
        {filteredStudents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery || selectedClass !== "all" || selectedGender !== "all" 
              ? "No students found matching your filters" 
              : "No students yet"}
          </div>
        )}
      </ScrollArea>

      <AddStudentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={onRefresh}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteStudentId} onOpenChange={() => setDeleteStudentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {studentToDelete?.full_name || "this student"}
              </span>
              ? This will remove all their class enrollments, attendance records, and check-in history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStudent}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}