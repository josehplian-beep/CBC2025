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
import { Loader2, Search, UserCheck, Users } from "lucide-react";
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

export function AddStudentDialog({ open, onOpenChange, onSuccess }: AddStudentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [existingStudentMemberIds, setExistingStudentMemberIds] = useState<Set<string>>(new Set());
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [fetchingMembers, setFetchingMembers] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMembers();
      fetchExistingStudents();
    } else {
      // Reset state when dialog closes
      setSearchQuery("");
      setSelectedMember(null);
      setGuardianName("");
      setGuardianPhone("");
    }
  }, [open]);

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

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    // Pre-fill guardian info if available
    if (member.phone) {
      setGuardianPhone(member.phone);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMember) {
      toast.error("Please select a member");
      return;
    }
    
    if (!guardianName.trim()) {
      toast.error("Please enter guardian name");
      return;
    }
    
    if (!guardianPhone.trim()) {
      toast.error("Please enter guardian phone");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("students").insert({
        full_name: selectedMember.name,
        member_id: selectedMember.id,
        photo_url: selectedMember.profile_image_url,
        date_of_birth: selectedMember.date_of_birth || new Date().toISOString().split("T")[0],
        guardian_name: guardianName.trim(),
        guardian_phone: guardianPhone.trim(),
      });

      if (error) throw error;

      toast.success(`${selectedMember.name} added as a student`);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyStudent = (memberId: string) => existingStudentMemberIds.has(memberId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add Student from Member Directory
          </DialogTitle>
          <DialogDescription>
            Select a member to enroll as a student. Students must be existing members.
          </DialogDescription>
        </DialogHeader>

        {!selectedMember ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

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
                  {filteredMembers.map((member) => {
                    const alreadyStudent = isAlreadyStudent(member.id);
                    return (
                      <Card
                        key={member.id}
                        className={cn(
                          "p-3 transition-all",
                          alreadyStudent
                            ? "opacity-50 cursor-not-allowed bg-muted"
                            : "cursor-pointer hover:border-primary hover:bg-accent/50"
                        )}
                        onClick={() => !alreadyStudent && handleSelectMember(member)}
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
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected Member Preview */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedMember.profile_image_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedMember.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{selectedMember.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedMember.email || selectedMember.phone || "Selected from Member Directory"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMember(null)}
                >
                  Change
                </Button>
              </div>
            </Card>

            {/* Guardian Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guardian_name">Guardian/Parent Name *</Label>
                <Input
                  id="guardian_name"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Enter guardian's name"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_phone">Guardian Phone *</Label>
                <Input
                  id="guardian_phone"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  maxLength={20}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {selectedMember && (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Student
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}