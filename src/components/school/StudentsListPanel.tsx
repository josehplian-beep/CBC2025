import React, { useState, useEffect } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
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
import { Search, Plus, BookOpen, Trash2, GripVertical } from "lucide-react";
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

interface StudentsListPanelProps {
  students: Student[];
  classes: Class[];
  onRefresh: () => void;
}

function DroppableClassCard({ cls }: { cls: Class }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `class-drop-${cls.id}`,
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "p-3 transition-all cursor-pointer",
        isOver
          ? "border-primary bg-primary/10 scale-[1.02] shadow-lg"
          : "hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium truncate">{cls.class_name}</span>
      </div>
    </Card>
  );
}

function DraggableStudentCard({
  student,
  classNames,
  age,
  isAdmin,
  onDelete,
}: {
  student: Student;
  classNames: string[];
  age: number | null;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `student-${student.id}`,
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "p-4 transition-all",
        isDragging
          ? "opacity-90 shadow-lg scale-105 ring-2 ring-primary/50"
          : "hover:shadow-md hover:border-border"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing mt-1"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <Avatar className="h-12 w-12">
          <AvatarImage src={student.photo_url || undefined} />
          <AvatarFallback className="bg-green-500/10 text-green-600">
            {student.full_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{student.full_name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {age ? `Age ${age} • ` : ""}{student.guardian_name}
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
  const [searchQuery, setSearchQuery] = useState("");
  const [studentClasses, setStudentClasses] = useState<Record<string, string[]>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isAdministrator } = usePermissions();

  useEffect(() => {
    const fetchStudentClasses = async () => {
      const { data } = await supabase
        .from("student_classes")
        .select("student_id, class_id");

      if (data) {
        const mapping: Record<string, string[]> = {};
        data.forEach((item) => {
          if (!mapping[item.student_id]) {
            mapping[item.student_id] = [];
          }
          mapping[item.student_id].push(item.class_id);
        });
        setStudentClasses(mapping);
      }
    };

    fetchStudentClasses();
  }, [students]);

  const filteredStudents = students.filter((s) =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.guardian_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="flex h-[calc(100vh-220px)]">
      {/* Students List */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">All Students</h2>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Student
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <DraggableStudentCard
                key={student.id}
                student={student}
                classNames={getClassNames(student.id)}
                age={getAge(student.date_of_birth)}
                isAdmin={isAdministrator}
                onDelete={setDeleteStudentId}
              />
            ))}
          </div>
          {filteredStudents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No students found matching your search" : "No students yet"}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Classes Drop Zone */}
      <div className="w-72 border-l bg-muted/30 p-4">
        <h3 className="font-semibold text-foreground mb-2">Enroll in Class</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Drag a student onto a class to enroll them
        </p>
        <ScrollArea className="h-[calc(100vh-360px)]">
          <div className="space-y-2">
            {classes.map((cls) => (
              <DroppableClassCard key={cls.id} cls={cls} />
            ))}
          </div>
        </ScrollArea>
      </div>

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