import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, UserCircle, Check } from "lucide-react";

interface Member {
  id: string;
  name: string;
  profile_image_url: string | null;
  email: string | null;
  phone: string | null;
}

interface AddTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddTeacherDialog({ open, onOpenChange, onSuccess }: AddTeacherDialogProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [existingTeacherMemberIds, setExistingTeacherMemberIds] = useState<string[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    if (open) {
      fetchMembersAndTeachers();
    }
  }, [open]);

  const fetchMembersAndTeachers = async () => {
    setLoadingMembers(true);
    try {
      const [membersRes, teachersRes] = await Promise.all([
        supabase.from("members").select("id, name, profile_image_url, email, phone").order("name"),
        supabase.from("teachers").select("member_id").not("member_id", "is", null),
      ]);

      if (membersRes.error) throw membersRes.error;
      if (teachersRes.error) throw teachersRes.error;

      setMembers(membersRes.data || []);
      setExistingTeacherMemberIds(teachersRes.data?.map((t) => t.member_id!).filter(Boolean) || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !existingTeacherMemberIds.includes(m.id)
  );

  const handleSubmit = async () => {
    if (!selectedMember) {
      toast.error("Please select a member");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("teachers").insert({
        full_name: selectedMember.name,
        member_id: selectedMember.id,
        photo_url: selectedMember.profile_image_url,
        email: selectedMember.email,
        phone: selectedMember.phone,
      });

      if (error) throw error;

      toast.success("Teacher added successfully");
      setSelectedMember(null);
      setSearchQuery("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to add teacher");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedMember(null);
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Teacher from Member Directory</DialogTitle>
          <DialogDescription>
            Select a member to assign as a Sunday School teacher. Only existing members can be teachers.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {loadingMembers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[280px] rounded-md border">
              <div className="p-2 space-y-1">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery
                      ? "No members found matching your search"
                      : "All members are already teachers"}
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedMember(member)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        selectedMember?.id === member.id
                          ? "bg-primary/10 ring-2 ring-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profile_image_url || undefined} />
                        <AvatarFallback>
                          <UserCircle className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.name}</p>
                        {member.email && (
                          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                        )}
                      </div>
                      {selectedMember?.id === member.id && (
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedMember}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add as Teacher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
