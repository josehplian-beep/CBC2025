import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Users, GraduationCap, UserCircle, Link2 } from "lucide-react";
import { DraggableMemberCard } from "./DraggableMemberCard";
import { cn } from "@/lib/utils";

interface Teacher {
  id: string;
  full_name: string;
  photo_url: string | null;
  member_id: string | null;
  member?: {
    id: string;
    name: string;
    profile_image_url: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

interface Student {
  id: string;
  full_name: string;
  photo_url: string | null;
  date_of_birth: string;
  guardian_name: string;
  member_id: string | null;
}

interface Member {
  id: string;
  name: string;
  profile_image_url: string | null;
  phone: string | null;
  email: string | null;
}

interface MemberDirectoryPanelProps {
  teachers: Teacher[];
  students: Student[];
  members: Member[];
  classTeachers: Teacher[];
  classStudents: Student[];
}

// Helper to check if member is already a teacher
function getMemberTeacherStatus(member: Member, teachers: Teacher[]) {
  return teachers.find((t) => t.member_id === member.id);
}

export function MemberDirectoryPanel({
  teachers,
  students,
  members,
  classTeachers,
  classStudents,
}: MemberDirectoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("members");

  const { setNodeRef: setTeachersDropRef, isOver: isOverTeachers } = useDroppable({
    id: "teachers-drop-zone",
  });

  const { setNodeRef: setStudentsDropRef, isOver: isOverStudents } = useDroppable({
    id: "students-drop-zone",
  });

  const availableTeachers = teachers.filter(
    (t) =>
      !classTeachers.some((ct) => ct.id === t.id) &&
      (t.member?.name || t.full_name).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableStudents = students.filter(
    (s) =>
      !classStudents.some((cs) => cs.id === s.id) &&
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get teacher display data
  const getTeacherDisplay = (teacher: Teacher) => {
    if (teacher.member) {
      return {
        name: teacher.member.name,
        photo: teacher.member.profile_image_url,
        isLinked: true,
      };
    }
    return {
      name: teacher.full_name,
      photo: teacher.photo_url,
      isLinked: false,
    };
  };

  return (
    <div className="w-80 border-l bg-card/50 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-foreground mb-3">Directory</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 grid grid-cols-3">
          <TabsTrigger value="members" className="text-xs">
            <UserCircle className="h-3 w-3 mr-1" />
            Members
          </TabsTrigger>
          <TabsTrigger value="teachers" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Teachers
          </TabsTrigger>
          <TabsTrigger value="students" className="text-xs">
            <GraduationCap className="h-3 w-3 mr-1" />
            Students
          </TabsTrigger>
        </TabsList>

        {/* Members Tab - Primary for assigning from directory */}
        <TabsContent value="members" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <div className="p-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2">
              Drag members to assign as teacher or student
            </p>
            {/* Drop zones */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Card
                ref={setTeachersDropRef}
                className={cn(
                  "p-2 text-center transition-all cursor-pointer",
                  isOverTeachers
                    ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                    : "border-dashed hover:border-blue-500/50"
                )}
              >
                <Users className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <p className="text-xs text-muted-foreground">Drop as Teacher</p>
              </Card>
              <Card
                ref={setStudentsDropRef}
                className={cn(
                  "p-2 text-center transition-all cursor-pointer",
                  isOverStudents
                    ? "border-green-500 bg-green-500/10 scale-[1.02]"
                    : "border-dashed hover:border-green-500/50"
                )}
              >
                <GraduationCap className="h-4 w-4 mx-auto mb-1 text-green-600" />
                <p className="text-xs text-muted-foreground">Drop as Student</p>
              </Card>
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-420px)]">
            <div className="px-4 space-y-2">
              {filteredMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No members found
                </p>
              ) : (
                filteredMembers.map((member) => {
                  const existingTeacher = getMemberTeacherStatus(member, teachers);
                  return (
                    <div key={member.id} className="relative">
                      <DraggableMemberCard
                        id={`member-${member.id}`}
                        name={member.name}
                        imageUrl={member.profile_image_url}
                        type="member"
                        subtitle={member.email || member.phone || undefined}
                      />
                      {existingTeacher && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-600 border-blue-500/20"
                        >
                          <Link2 className="h-2.5 w-2.5 mr-0.5" />
                          Teacher
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="teachers" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-[calc(100vh-340px)]">
            <div className="p-4 space-y-2">
              {availableTeachers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {searchQuery ? "No teachers found" : "All teachers assigned"}
                </p>
              ) : (
                availableTeachers.map((teacher) => {
                  const display = getTeacherDisplay(teacher);
                  return (
                    <div key={teacher.id} className="relative">
                      <DraggableMemberCard
                        id={`teacher-${teacher.id}`}
                        name={display.name}
                        imageUrl={display.photo}
                        type="teacher"
                      />
                      {display.isLinked && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-600 border-green-500/20"
                        >
                          <Link2 className="h-2.5 w-2.5" />
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="students" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-[calc(100vh-340px)]">
            <div className="p-4 space-y-2">
              {availableStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {searchQuery ? "No students found" : "All students enrolled"}
                </p>
              ) : (
                availableStudents.map((student) => (
                  <DraggableMemberCard
                    key={student.id}
                    id={`student-${student.id}`}
                    name={student.full_name}
                    imageUrl={student.photo_url}
                    type="student"
                    subtitle={student.guardian_name}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}