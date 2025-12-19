import React, { useState, useEffect } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
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
import { Search, Plus, BookOpen, Trash2, Link2, GripVertical, ExternalLink } from "lucide-react";
import { AddTeacherDialog } from "./AddTeacherDialog";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

interface Teacher {
  id: string;
  full_name: string;
  photo_url: string | null;
  member_id: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  member?: {
    id: string;
    name: string;
    profile_image_url: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

interface Class {
  id: string;
  class_name: string;
  description: string | null;
}

interface TeachersListPanelProps {
  teachers: Teacher[];
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

// Helper to get display data from teacher (preferring linked member data)
function getTeacherDisplayData(teacher: Teacher) {
  if (teacher.member) {
    return {
      name: teacher.member.name,
      photo: teacher.member.profile_image_url,
      email: teacher.member.email,
      phone: teacher.member.phone,
      isLinked: true,
    };
  }
  return {
    name: teacher.full_name,
    photo: teacher.photo_url,
    email: teacher.email,
    phone: teacher.phone,
    isLinked: false,
  };
}

function DraggableTeacherCard({
  teacher,
  classNames,
  isAdmin,
  onDelete,
  onViewProfile,
}: {
  teacher: Teacher;
  classNames: string[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onViewProfile: (memberId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `teacher-${teacher.id}`,
  });

  const display = getTeacherDisplayData(teacher);
  const memberId = teacher.member?.id || teacher.member_id;

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
          <AvatarImage src={display.photo || undefined} />
          <AvatarFallback className="bg-blue-500/10 text-blue-600">
            {display.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {memberId ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile(memberId);
                }}
                className="font-medium text-foreground truncate hover:text-primary hover:underline transition-colors flex items-center gap-1 text-left"
              >
                {display.name}
                <ExternalLink className="h-3 w-3 opacity-50" />
              </button>
            ) : (
              <p className="font-medium text-foreground truncate">{display.name}</p>
            )}
            {display.isLinked && (
              <span title="Linked to Member Directory">
                <Link2 className="h-3 w-3 text-green-600" />
              </span>
            )}
          </div>
          {(display.email || display.phone) && (
            <p className="text-sm text-muted-foreground truncate">
              {display.email || display.phone}
            </p>
          )}
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
              onDelete(teacher.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

export function TeachersListPanel({ teachers, classes, onRefresh }: TeachersListPanelProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [teacherClasses, setTeacherClasses] = useState<Record<string, string[]>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTeacherId, setDeleteTeacherId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { isAdministrator } = usePermissions();

  const handleViewProfile = (memberId: string) => {
    navigate(`/members/${memberId}`);
  };

  useEffect(() => {
    const fetchTeacherClasses = async () => {
      const { data } = await supabase
        .from("class_teachers")
        .select("teacher_id, class_id");

      if (data) {
        const mapping: Record<string, string[]> = {};
        data.forEach((item) => {
          if (!mapping[item.teacher_id]) {
            mapping[item.teacher_id] = [];
          }
          mapping[item.teacher_id].push(item.class_id);
        });
        setTeacherClasses(mapping);
      }
    };

    fetchTeacherClasses();
  }, [teachers]);

  const filteredTeachers = teachers.filter((t) => {
    const display = getTeacherDisplayData(t);
    return display.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getClassNames = (teacherId: string) => {
    const classIds = teacherClasses[teacherId] || [];
    return classes
      .filter((c) => classIds.includes(c.id))
      .map((c) => c.class_name);
  };

  const handleDeleteTeacher = async () => {
    if (!deleteTeacherId) return;
    
    setDeleting(true);
    try {
      // First remove from all class assignments
      await supabase
        .from("class_teachers")
        .delete()
        .eq("teacher_id", deleteTeacherId);

      // Then delete the teacher
      const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", deleteTeacherId);

      if (error) throw error;
      
      toast.success("Teacher deleted successfully");
      onRefresh();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast.error("Failed to delete teacher");
    } finally {
      setDeleting(false);
      setDeleteTeacherId(null);
    }
  };

  const teacherToDelete = deleteTeacherId 
    ? teachers.find((t) => t.id === deleteTeacherId) 
    : null;

  return (
    <div className="flex h-[calc(100vh-220px)]">
      {/* Teachers List */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">All Teachers</h2>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Teacher
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((teacher) => (
              <DraggableTeacherCard
                key={teacher.id}
                teacher={teacher}
                classNames={getClassNames(teacher.id)}
                isAdmin={isAdministrator}
                onDelete={setDeleteTeacherId}
                onViewProfile={handleViewProfile}
              />
            ))}
          </div>
          {filteredTeachers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No teachers found matching your search" : "No teachers yet"}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Classes Drop Zone */}
      <div className="w-72 border-l bg-muted/30 p-4">
        <h3 className="font-semibold text-foreground mb-2">Assign to Class</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Drag a teacher onto a class to assign them
        </p>
        <ScrollArea className="h-[calc(100vh-360px)]">
          <div className="space-y-2">
            {classes.map((cls) => (
              <DroppableClassCard key={cls.id} cls={cls} />
            ))}
          </div>
        </ScrollArea>
      </div>

      <AddTeacherDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={onRefresh}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTeacherId} onOpenChange={() => setDeleteTeacherId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {teacherToDelete ? getTeacherDisplayData(teacherToDelete).name : "this teacher"}
              </span>
              ? This will remove them from all assigned classes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeacher}
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