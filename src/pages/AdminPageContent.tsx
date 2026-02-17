import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Save, Trash2, GripVertical, ArrowUp, ArrowDown, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PageContentRow {
  id: string;
  page_key: string;
  section_key: string;
  content: string;
  display_order: number;
  is_bold: boolean;
  created_at: string;
  updated_at: string;
}

const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const AdminPageContent = () => {
  const queryClient = useQueryClient();
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});

  const { data: paragraphs, isLoading } = useQuery({
    queryKey: ["page-content", "about", "our_story"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_content")
        .select("*")
        .eq("page_key", "about")
        .eq("section_key", "our_story")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as PageContentRow[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase
        .from("page_content")
        .update({ content })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-content"] });
      toast.success("Paragraph updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = paragraphs?.length
        ? Math.max(...paragraphs.map((p) => p.display_order))
        : 0;
      const { error } = await supabase.from("page_content").insert({
        page_key: "about",
        section_key: "our_story",
        content: "New paragraph...",
        display_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-content"] });
      toast.success("Paragraph added");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("page_content")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-content"] });
      toast.success("Paragraph deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const moveMutation = useMutation({
    mutationFn: async ({
      id,
      currentOrder,
      targetOrder,
      swapId,
    }: {
      id: string;
      currentOrder: number;
      targetOrder: number;
      swapId: string;
    }) => {
      // Swap display_order between two items
      const { error: e1 } = await supabase
        .from("page_content")
        .update({ display_order: targetOrder })
        .eq("id", id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("page_content")
        .update({ display_order: currentOrder })
        .eq("id", swapId);
      if (e2) throw e2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-content"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSave = (id: string) => {
    const content = editedContent[id];
    if (content !== undefined) {
      updateMutation.mutate({ id, content });
      setEditedContent((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (!paragraphs) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= paragraphs.length) return;
    moveMutation.mutate({
      id: paragraphs[index].id,
      currentOrder: paragraphs[index].display_order,
      targetOrder: paragraphs[targetIndex].display_order,
      swapId: paragraphs[targetIndex].id,
    });
  };

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit About Page</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Edit the "Our Story" paragraphs. Use **text** for bold formatting.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>About Page Preview — Our Story</DialogTitle>
              </DialogHeader>
              <div className="text-muted-foreground text-base leading-relaxed space-y-4 pt-2">
                {paragraphs?.map((p) => {
                  const content = editedContent[p.id] ?? p.content;
                  return <p key={p.id}>{renderBoldText(content)}</p>;
                })}
                {(!paragraphs || paragraphs.length === 0) && (
                  <p className="text-sm italic">No paragraphs yet.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
            <Plus className="w-4 h-4 mr-2" />
            Add Paragraph
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {paragraphs?.map((paragraph, index) => {
          const currentContent =
            editedContent[paragraph.id] ?? paragraph.content;
          const isDirty = editedContent[paragraph.id] !== undefined;

          return (
            <Card key={paragraph.id} className="border-border">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Paragraph {index + 1}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === 0}
                    onClick={() => handleMove(index, "up")}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === (paragraphs?.length ?? 0) - 1}
                    onClick={() => handleMove(index, "down")}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Delete this paragraph?")) {
                        deleteMutation.mutate(paragraph.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={currentContent}
                  onChange={(e) =>
                    setEditedContent((prev) => ({
                      ...prev,
                      [paragraph.id]: e.target.value,
                    }))
                  }
                  rows={4}
                  className="resize-y"
                />
                {isDirty && (
                  <Button
                    size="sm"
                    onClick={() => handleSave(paragraph.id)}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPageContent;
