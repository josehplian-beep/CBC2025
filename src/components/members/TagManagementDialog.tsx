import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";
import { MemberTagBadge } from "./MemberTagBadge";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagsUpdated: () => void;
}

const TAG_COLORS = [
  "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
];

export const TagManagementDialog = ({ open, onOpenChange, onTagsUpdated }: TagManagementDialogProps) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadTags();
    }
  }, [open]);

  const loadTags = async () => {
    const { data, error } = await supabase
      .from('member_tags')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setTags(data);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('member_tags')
        .insert({ name: newTagName.trim(), color: newTagColor });

      if (error) throw error;

      toast({ title: "Success", description: "Tag created successfully" });
      setNewTagName("");
      setNewTagColor(TAG_COLORS[0]);
      loadTags();
      onTagsUpdated();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;

    try {
      const { error } = await supabase
        .from('member_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast({ title: "Success", description: "Tag deleted successfully" });
      loadTags();
      onTagsUpdated();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>Create and manage tags to organize members.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>New Tag</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              />
              <div className="flex gap-1">
                {TAG_COLORS.slice(0, 5).map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded-full border-2 ${newTagColor === color ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
              </div>
              <Button onClick={handleAddTag} disabled={loading} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Existing Tags</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[60px]">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags created yet</p>
              ) : (
                tags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-1">
                    <MemberTagBadge name={tag.name} color={tag.color} />
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
