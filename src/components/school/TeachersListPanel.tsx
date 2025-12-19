import React, { useState, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, BookOpen } from "lucide-react";
import { AddTeacherDialog } from "./AddTeacherDialog";
import { cn } from "@/lib/utils";
import { DraggableMemberCard } from "./DraggableMemberCard";

interface Teacher {
  id: string;
  full_name: string;
  photo_url: string | null;
  member_id: string | null;
  email?: string | null;
  phone?: string | null;
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

export function TeachersListPanel({ teachers, classes, onRefresh }: TeachersListPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [teacherClasses, setTeacherClasses] = useState<Record<string, string[]>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
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

  const filteredTeachers = teachers.filter((t) =>
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getClassNames = (teacherId: string) => {
    const classIds = teacherClasses[teacherId] || [];
    return classes
      .filter((c) => classIds.includes(c.id))
      .map((c) => c.class_name);
  };

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
              <div key={teacher.id} className="relative">
                <DraggableMemberCard
                  id={`teacher-${teacher.id}`}
                  name={teacher.full_name}
                  imageUrl={teacher.photo_url}
                  type="teacher"
                  subtitle={teacher.email || teacher.phone || undefined}
                />
                {getClassNames(teacher.id).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {getClassNames(teacher.id).map((className) => (
                      <Badge key={className} variant="secondary" className="text-xs">
                        {className}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
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
    </div>
  );
}
