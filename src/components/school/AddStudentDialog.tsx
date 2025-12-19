import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, UserCheck, Users, UserPlus, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  name: string;
  profile_image_url: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
}

interface ExistingStudent {
  member_id: string | null;
}

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = "select-student" | "select-guardian" | "confirm";

export function AddStudentDialog({ open, onOpenChange, onSuccess }: AddStudentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("select-student");
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [existingStudentMemberIds, setExistingStudentMemberIds] = useState<Set<string>>(new Set());
  const [selectedStudent, setSelectedStudent] = useState<Member | null>(null);
  const [selectedGuardian, setSelectedGuardian] = useState<Member | null>(null);
  const [fetchingMembers, setFetchingMembers] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMembers();
      fetchExistingStudents();
    } else {
      // Reset state when dialog closes
      setStep("select-student");
      setSearchQuery("");
      setSelectedStudent(null);
      setSelectedGuardian(null);
    }
  }, [open]);

  // Clear search when changing steps
  useEffect(() => {
    setSearchQuery("");
  }, [step]);

  const fetchMembers = async () => {
    setFetchingMembers(true);
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, name, profile_image_url, phone, email, date_of_birth")
        .order("name");
      
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setFetchingMembers(false);
    }
  };

  const fetchExistingStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("member_id")
        .not("member_id", "is", null);
      
      if (error) throw error;
      
      const memberIds = new Set((data || []).map((s: ExistingStudent) => s.member_id).filter(Boolean) as string[]);
      setExistingStudentMemberIds(memberIds);
    } catch (error) {
      console.error("Error fetching existing students:", error);
    }
  };

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectStudent = (member: Member) => {
    setSelectedStudent(member);
    setStep("select-guardian");
  };

  const handleSelectGuardian = (member: Member) => {
    setSelectedGuardian(member);
    setStep("confirm");
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !selectedGuardian) {
      toast.error("Please select both student and guardian");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("students").insert({
        full_name: selectedStudent.name,
        member_id: selectedStudent.id,
        photo_url: selectedStudent.profile_image_url,
        date_of_birth: selectedStudent.date_of_birth || new Date().toISOString().split("T")[0],
        guardian_name: selectedGuardian.name,
        guardian_phone: selectedGuardian.phone || "",
      });

      if (error) throw error;

      toast.success(`${selectedStudent.name} added as a student with ${selectedGuardian.name} as guardian`);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyStudent = (memberId: string) => existingStudentMemberIds.has(memberId);

  const renderMemberList = (
    onSelect: (member: Member) => void,
    excludeMemberId?: string,
    showAlreadyEnrolled?: boolean
  ) => (
    <ScrollArea className="h-[300px] border rounded-md">
      {fetchingMembers ? (
        <div className="flex items-center justify-center h-full py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? "No members found" : "No members in directory"}
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {filteredMembers
            .filter((m) => m.id !== excludeMemberId)
            .map((member) => {
              const alreadyStudent = showAlreadyEnrolled && isAlreadyStudent(member.id);
              return (
                <Card
                  key={member.id}
                  className={cn(
                    "p-3 transition-all",
                    alreadyStudent
                      ? "opacity-50 cursor-not-allowed bg-muted"
                      : "cursor-pointer hover:border-primary hover:bg-accent/50"
                  )}
                  onClick={() => !alreadyStudent && onSelect(member)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profile_image_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{member.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.email || member.phone || "No contact info"}
                      </p>
                    </div>
                    {alreadyStudent && (
                      <Badge variant="secondary" className="text-xs">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Already enrolled
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
        </div>
      )}
    </ScrollArea>
  );

  const renderSelectedMember = (member: Member, label: string, onClear: () => void) => (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={member.profile_image_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {member.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-medium text-foreground truncate">{member.name}</p>
          {member.phone && (
            <p className="text-sm text-muted-foreground">{member.phone}</p>
          )}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Change
        </Button>
      </div>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== "select-student" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 mr-1"
                onClick={() => {
                  if (step === "select-guardian") {
                    setSelectedStudent(null);
                    setStep("select-student");
                  } else if (step === "confirm") {
                    setSelectedGuardian(null);
                    setStep("select-guardian");
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Users className="h-5 w-5" />
            {step === "select-student" && "Select Student"}
            {step === "select-guardian" && "Select Guardian"}
            {step === "confirm" && "Confirm Enrollment"}
          </DialogTitle>
          <DialogDescription>
            {step === "select-student" && "Choose the child/student from the Member Directory."}
            {step === "select-guardian" && "Choose the parent/guardian from the Member Directory."}
            {step === "confirm" && "Review and confirm the student enrollment."}
          </DialogDescription>
        </DialogHeader>

        {step === "select-student" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for child/student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {renderMemberList(handleSelectStudent, undefined, true)}
          </div>
        )}

        {step === "select-guardian" && selectedStudent && (
          <div className="space-y-4">
            {renderSelectedMember(selectedStudent, "Student", () => {
              setSelectedStudent(null);
              setStep("select-student");
            })}
            
            <div className="pt-2">
              <Label className="text-sm font-medium mb-2 block">Select Guardian/Parent</Label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for parent/guardian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {renderMemberList(handleSelectGuardian, selectedStudent.id, false)}
            </div>
          </div>
        )}

        {step === "confirm" && selectedStudent && selectedGuardian && (
          <div className="space-y-4">
            <div className="space-y-3">
              {renderSelectedMember(selectedStudent, "Student", () => {
                setSelectedStudent(null);
                setSelectedGuardian(null);
                setStep("select-student");
              })}
              
              {renderSelectedMember(selectedGuardian, "Guardian/Parent", () => {
                setSelectedGuardian(null);
                setStep("select-guardian");
              })}
            </div>

            <Card className="p-4 bg-muted/50">
              <div className="flex items-start gap-3">
                <UserPlus className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Ready to Enroll</p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">{selectedStudent.name}</span> will be enrolled as a student 
                    with <span className="font-medium">{selectedGuardian.name}</span> as their guardian.
                  </p>
                  {selectedGuardian.phone && (
                    <p className="text-muted-foreground mt-1">
                      Guardian contact: {selectedGuardian.phone}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === "confirm" && (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enroll Student
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}