import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MemberRelationshipsSectionProps {
  memberId: string;
  memberGender?: string | null;
  canEdit: boolean;
}

interface Relationship {
  id: string;
  related_member_id: string;
  relationship_type: string;
  is_custom: boolean;
  related_member: {
    id: string;
    name: string;
    profile_image_url: string | null;
    gender: string | null;
  };
}

interface Member {
  id: string;
  name: string;
  profile_image_url: string | null;
  gender: string | null;
}

const STANDARD_RELATIONSHIPS = [
  "Father",
  "Mother",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Grandfather",
  "Grandmother",
  "Uncle",
  "Aunt",
  "Cousin",
  "Spouse",
];

// Reciprocal relationship mapping
const getReciprocalRelationship = (
  relationship: string,
  relatedMemberGender?: string | null
): string => {
  const isMale = relatedMemberGender?.toLowerCase() === "male";
  const isFemale = relatedMemberGender?.toLowerCase() === "female";

  switch (relationship) {
    case "Father":
    case "Mother":
      return isMale ? "Son" : isFemale ? "Daughter" : "Child";
    case "Son":
    case "Daughter":
      return isMale ? "Father" : isFemale ? "Mother" : "Parent";
    case "Brother":
    case "Sister":
      return isMale ? "Brother" : isFemale ? "Sister" : "Sibling";
    case "Grandfather":
    case "Grandmother":
      return isMale ? "Grandson" : isFemale ? "Granddaughter" : "Grandchild";
    case "Uncle":
    case "Aunt":
      return isMale ? "Nephew" : isFemale ? "Niece" : "Niece/Nephew";
    case "Cousin":
      return "Cousin";
    case "Spouse":
      return "Spouse";
    default:
      return relationship; // For custom relationships, use the same label
  }
};

export function MemberRelationshipsSection({
  memberId,
  memberGender,
  canEdit,
}: MemberRelationshipsSectionProps) {
  const navigate = useNavigate();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState("");
  const [customRelationship, setCustomRelationship] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRelationships();
    loadAllMembers();
  }, [memberId]);

  const loadRelationships = async () => {
    const { data, error } = await supabase
      .from("member_relationships")
      .select("id, related_member_id, relationship_type, is_custom")
      .eq("member_id", memberId);

    if (error) {
      console.error("Error loading relationships:", error);
      return;
    }

    // Fetch related member details
    if (data && data.length > 0) {
      const relatedIds = data.map((r) => r.related_member_id);
      const { data: members } = await supabase
        .from("members")
        .select("id, name, profile_image_url, gender")
        .in("id", relatedIds);

      const enrichedRelationships = data.map((rel) => ({
        ...rel,
        related_member: members?.find((m) => m.id === rel.related_member_id) || {
          id: rel.related_member_id,
          name: "Unknown",
          profile_image_url: null,
          gender: null,
        },
      }));

      setRelationships(enrichedRelationships);
    } else {
      setRelationships([]);
    }
  };

  const loadAllMembers = async () => {
    const { data } = await supabase
      .from("members")
      .select("id, name, profile_image_url, gender")
      .neq("id", memberId)
      .order("name");

    if (data) {
      setAllMembers(data);
    }
  };

  const handleAddRelationship = async () => {
    if (!selectedMember) {
      toast.error("Please select a member");
      return;
    }

    const relationshipType = isCustom ? customRelationship : selectedRelationship;
    if (!relationshipType) {
      toast.error("Please select or enter a relationship type");
      return;
    }

    setLoading(true);

    try {
      const { data: session } = await supabase.auth.getSession();

      // Add the relationship
      const { error: insertError } = await supabase
        .from("member_relationships")
        .insert({
          member_id: memberId,
          related_member_id: selectedMember.id,
          relationship_type: relationshipType,
          is_custom: isCustom,
          created_by: session?.session?.user?.id,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          toast.error("This relationship already exists");
        } else {
          throw insertError;
        }
        return;
      }

      // Add reciprocal relationship
      const reciprocalType = getReciprocalRelationship(
        relationshipType,
        memberGender
      );

      await supabase.from("member_relationships").insert({
        member_id: selectedMember.id,
        related_member_id: memberId,
        relationship_type: reciprocalType,
        is_custom: isCustom,
        created_by: session?.session?.user?.id,
      });

      toast.success("Relationship added successfully");
      setDialogOpen(false);
      resetForm();
      loadRelationships();
    } catch (error: any) {
      console.error("Error adding relationship:", error);
      toast.error("Failed to add relationship");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRelationship = async (relationship: Relationship) => {
    try {
      // Remove both directions of the relationship
      await supabase
        .from("member_relationships")
        .delete()
        .eq("id", relationship.id);

      await supabase
        .from("member_relationships")
        .delete()
        .eq("member_id", relationship.related_member_id)
        .eq("related_member_id", memberId);

      toast.success("Relationship removed");
      loadRelationships();
    } catch (error) {
      console.error("Error removing relationship:", error);
      toast.error("Failed to remove relationship");
    }
  };

  const resetForm = () => {
    setSelectedMember(null);
    setSelectedRelationship("");
    setCustomRelationship("");
    setIsCustom(false);
  };

  const getRelationshipColor = (type: string): string => {
    switch (type) {
      case "Father":
      case "Mother":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "Son":
      case "Daughter":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "Brother":
      case "Sister":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "Spouse":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
      case "Grandfather":
      case "Grandmother":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "Uncle":
      case "Aunt":
      case "Cousin":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Filter out members that already have a relationship
  const availableMembers = allMembers.filter(
    (m) => !relationships.some((r) => r.related_member_id === m.id)
  );

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Family Members</h3>
          <Badge variant="secondary" className="ml-1">
            {relationships.length}
          </Badge>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Family Relationship</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Member Selection */}
                <div className="space-y-2">
                  <Label>Select Member</Label>
                  <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedMember ? selectedMember.name : "Search members..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search members..." />
                        <CommandList>
                          <CommandEmpty>No members found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {availableMembers.map((member) => (
                              <CommandItem
                                key={member.id}
                                value={member.name}
                                onSelect={() => {
                                  setSelectedMember(member);
                                  setMemberSearchOpen(false);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  {member.profile_image_url ? (
                                    <img
                                      src={member.profile_image_url}
                                      alt={member.name}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                      {member.name.charAt(0)}
                                    </div>
                                  )}
                                  <span>{member.name}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Relationship Type Selection */}
                <div className="space-y-2">
                  <Label>Relationship Type</Label>
                  <Select
                    value={isCustom ? "custom" : selectedRelationship}
                    onValueChange={(value) => {
                      if (value === "custom") {
                        setIsCustom(true);
                        setSelectedRelationship("");
                      } else {
                        setIsCustom(false);
                        setSelectedRelationship(value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STANDARD_RELATIONSHIPS.map((rel) => (
                        <SelectItem key={rel} value={rel}>
                          {rel}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Relationship Input */}
                {isCustom && (
                  <div className="space-y-2">
                    <Label>Custom Relationship Name</Label>
                    <Input
                      placeholder="e.g., Legal Guardian, Godparent"
                      value={customRelationship}
                      onChange={(e) => setCustomRelationship(e.target.value)}
                    />
                  </div>
                )}

                <Button
                  onClick={handleAddRelationship}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Adding..." : "Add Relationship"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {relationships.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No family relationships added yet.
        </p>
      ) : (
        <div className="space-y-2">
          {relationships.map((rel) => (
            <div
              key={rel.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
            >
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => navigate(`/members/${rel.related_member_id}`)}
              >
                {rel.related_member.profile_image_url ? (
                  <img
                    src={rel.related_member.profile_image_url}
                    alt={rel.related_member.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {rel.related_member.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{rel.related_member.name}</p>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getRelationshipColor(rel.relationship_type)}`}
                  >
                    {rel.relationship_type}
                  </Badge>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveRelationship(rel);
                  }}
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
