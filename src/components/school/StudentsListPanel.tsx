import React, { useState, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { DraggableMemberCard } from "./DraggableMemberCard";
import { format, differenceInYears } from "date-fns";

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

export function StudentsListPanel({ students, classes, onRefresh }: StudentsListPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [studentClasses, setStudentClasses] = useState<Record<string, string[]>>({});

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

  return (
    <div className="flex h-[calc(100vh-220px)]">
      {/* Students List */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">All Students</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => {
              const age = getAge(student.date_of_birth);
              return (
                <div key={student.id} className="relative">
                  <DraggableMemberCard
                    id={`student-${student.id}`}
                    name={student.full_name}
                    imageUrl={student.photo_url}
                    type="student"
                    subtitle={`${age ? `Age ${age} • ` : ""}${student.guardian_name}`}
                  />
                  {getClassNames(student.id).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {getClassNames(student.id).map((className) => (
                        <Badge key={className} variant="secondary" className="text-xs">
                          {className}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
    </div>
  );
}
