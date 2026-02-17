import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [editedContent, setEditedContent] = useState<string | null>(null);

  const { data: row, isLoading } = useQuery({
    queryKey: ["page-content", "about", "our_story"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_content")
        .select("*")
        .eq("page_key", "about")
        .eq("section_key", "our_story")
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; content: string; page_key: string; section_key: string; display_order: number; is_bold: boolean; created_at: string; updated_at: string } | null;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (content: string) => {
      if (row) {
        const { error } = await supabase
          .from("page_content")
          .update({ content })
          .eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("page_content").insert({
          page_key: "about",
          section_key: "our_story",
          content,
          display_order: 0,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-content"] });
      setEditedContent(null);
      toast.success("Content saved successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const currentContent = editedContent ?? row?.content ?? "";
  const isDirty = editedContent !== null;

  // Split by double newlines for preview paragraphs
  const previewParagraphs = currentContent
    .split(/\n\n+/)
    .filter((p) => p.trim());

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit About Page</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Edit the "Our Story" section. Use **text** for bold. Separate paragraphs with blank lines.
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
                {previewParagraphs.length > 0 ? (
                  previewParagraphs.map((p, i) => (
                    <p key={i}>{renderBoldText(p.trim())}</p>
                  ))
                ) : (
                  <p className="text-sm italic">No content yet.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Our Story Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={currentContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={16}
            className="resize-y font-mono text-sm"
            placeholder="Write your story here. Use **bold** for emphasis. Separate paragraphs with blank lines."
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={() => upsertMutation.mutate(currentContent)}
              disabled={!isDirty || upsertMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {upsertMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            {isDirty && (
              <Button variant="ghost" onClick={() => setEditedContent(null)}>
                Discard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPageContent;
