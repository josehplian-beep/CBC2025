import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Tag } from "lucide-react";
import { MemberTagBadge } from "./MemberTagBadge";

interface MemberTag {
  id: string;
  name: string;
  color: string;
}

interface MemberTagsSectionProps {
  memberId: string;
  canEdit: boolean;
  compact?: boolean;
}

export const MemberTagsSection = ({ memberId, canEdit, compact = false }: MemberTagsSectionProps) => {
  const [allTags, setAllTags] = useState<MemberTag[]>([]);
  const [assignedTags, setAssignedTags] = useState<MemberTag[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [memberId]);

  const loadData = async () => {
    // Load all tags
    const { data: tags } = await supabase
      .from('member_tags')
      .select('*')
      .order('name');

    if (tags) setAllTags(tags);

    // Load assigned tags
    const { data: assignments } = await supabase
      .from('member_tag_assignments')
      .select('tag_id, member_tags(*)')
      .eq('member_id', memberId);

    if (assignments) {
      setAssignedTags(assignments.map(a => a.member_tags as MemberTag).filter(Boolean));
    }
  };

  const handleAssignTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('member_tag_assignments')
        .insert({ member_id: memberId, tag_id: tagId });

      if (error) throw error;
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('member_tag_assignments')
        .delete()
        .eq('member_id', memberId)
        .eq('tag_id', tagId);

      if (error) throw error;
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const availableTags = allTags.filter(t => !assignedTags.some(at => at.id === t.id));

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {assignedTags.map(tag => (
          <MemberTagBadge key={tag.id} name={tag.name} color={tag.color} size="sm" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tag className="h-4 w-4 text-muted-foreground" />
      {assignedTags.map(tag => (
        <MemberTagBadge
          key={tag.id}
          name={tag.name}
          color={tag.color}
          onRemove={canEdit ? () => handleRemoveTag(tag.id) : undefined}
        />
      ))}
      {canEdit && availableTags.length > 0 && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 px-2">
              <Plus className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="space-y-1">
              {availableTags.map(tag => (
                <button
                  key={tag.id}
                  className="w-full text-left px-2 py-1 rounded hover:bg-muted text-sm flex items-center gap-2"
                  onClick={() => { handleAssignTag(tag.id); setPopoverOpen(false); }}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
      {assignedTags.length === 0 && !canEdit && (
        <span className="text-sm text-muted-foreground">No tags</span>
      )}
    </div>
  );
};
