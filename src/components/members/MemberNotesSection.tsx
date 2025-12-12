import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Save, X, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface Note {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string } | null;
}

interface MemberNotesSectionProps {
  memberId: string;
  canEdit: boolean;
}

export const MemberNotesSection = ({ memberId, canEdit }: MemberNotesSectionProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, [memberId]);

  const loadNotes = async () => {
    const { data, error } = await supabase
      .from('member_notes')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Load profile names separately
      const userIds = [...new Set(data.map(n => n.created_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      
      const notesWithProfiles = data.map(note => ({
        ...note,
        profiles: { full_name: profileMap.get(note.created_by) || 'Unknown' }
      }));
      
      setNotes(notesWithProfiles);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('member_notes')
        .insert({ member_id: memberId, content: newNote.trim(), created_by: user.id });

      if (error) throw error;

      toast({ title: "Success", description: "Note added" });
      setNewNote("");
      loadNotes();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('member_notes')
        .update({ content: editContent.trim() })
        .eq('id', noteId);

      if (error) throw error;

      toast({ title: "Success", description: "Note updated" });
      setEditingId(null);
      loadNotes();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;

    try {
      const { error } = await supabase
        .from('member_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({ title: "Success", description: "Note deleted" });
      loadNotes();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Private Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a private note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[80px]"
            />
            <Button onClick={handleAddNote} disabled={loading || !newNote.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-3 bg-muted/30">
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdateNote(note.id)}>
                        <Save className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {note.profiles?.full_name || "Unknown"} • {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
