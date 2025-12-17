import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, GraduationCap, UserCircle } from "lucide-react";
import { DraggableMemberCard } from "./DraggableMemberCard";

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

export function MemberDirectoryPanel({
  teachers,
  students,
  members,
  classTeachers,
  classStudents,
}: MemberDirectoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("teachers");

  const availableTeachers = teachers.filter(
    (t) =>
      !classTeachers.some((ct) => ct.id === t.id) &&
      t.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableStudents = students.filter(
    (s) =>
      !classStudents.some((cs) => cs.id === s.id) &&
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <TabsTrigger value="teachers" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Teachers
          </TabsTrigger>
          <TabsTrigger value="students" className="text-xs">
            <GraduationCap className="h-3 w-3 mr-1" />
            Students
          </TabsTrigger>
          <TabsTrigger value="members" className="text-xs">
            <UserCircle className="h-3 w-3 mr-1" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teachers" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-[calc(100vh-340px)]">
            <div className="p-4 space-y-2">
              {availableTeachers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {searchQuery ? "No teachers found" : "All teachers assigned"}
                </p>
              ) : (
                availableTeachers.map((teacher) => (
                  <DraggableMemberCard
                    key={teacher.id}
                    id={`teacher-${teacher.id}`}
                    name={teacher.full_name}
                    imageUrl={teacher.photo_url}
                    type="teacher"
                  />
                ))
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

        <TabsContent value="members" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-[calc(100vh-340px)]">
            <div className="p-4 space-y-2">
              <p className="text-xs text-muted-foreground mb-2 px-1">
                Drag members to Teachers zone to create as teacher
              </p>
              {filteredMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No members found
                </p>
              ) : (
                filteredMembers.map((member) => (
                  <DraggableMemberCard
                    key={member.id}
                    id={`member-${member.id}`}
                    name={member.name}
                    imageUrl={member.profile_image_url}
                    type="member"
                    subtitle={member.email || member.phone || undefined}
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
