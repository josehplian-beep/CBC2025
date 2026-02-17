import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Save,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SermonNote {
  id: string;
  title: string;
  content: string;
  timestamps: { time: string; label: string }[];
  updatedAt: string;
  createdAt: string;
}

const STORAGE_KEY = "sermon-notes";

function loadNotes(): Record<string, SermonNote> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveNotes(notes: Record<string, SermonNote>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export default function SermonNoteTaker({
  videoId,
  videoTitle,
}: {
  videoId: string;
  videoTitle?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState<SermonNote>(() => {
    const all = loadNotes();
    return (
      all[videoId] || {
        id: videoId,
        title: videoTitle || "",
        content: "",
        timestamps: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  });
  const [saved, setSaved] = useState(true);
  const [newTimestamp, setNewTimestamp] = useState("");
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Auto-save with debounce
  const autosave = useCallback(
    (updated: SermonNote) => {
      setSaved(false);
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        const all = loadNotes();
        all[videoId] = { ...updated, updatedAt: new Date().toISOString() };
        saveNotes(all);
        setSaved(true);
      }, 800);
    },
    [videoId]
  );

  const updateNote = (patch: Partial<SermonNote>) => {
    setNote((prev) => {
      const updated = { ...prev, ...patch };
      autosave(updated);
      return updated;
    });
  };

  const addTimestamp = () => {
    if (!newTimestamp.trim()) return;
    const now = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    updateNote({
      timestamps: [
        ...note.timestamps,
        { time: now, label: newTimestamp.trim() },
      ],
    });
    setNewTimestamp("");
  };

  const removeTimestamp = (index: number) => {
    updateNote({
      timestamps: note.timestamps.filter((_, i) => i !== index),
    });
  };

  const clearNote = () => {
    const all = loadNotes();
    delete all[videoId];
    saveNotes(all);
    setNote({
      id: videoId,
      title: videoTitle || "",
      content: "",
      timestamps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
  };

  const exportNote = () => {
    const text = [
      `# ${note.title || "Sermon Notes"}`,
      "",
      note.content,
      "",
      note.timestamps.length > 0 ? "## Key Moments" : "",
      ...note.timestamps.map((t) => `- [${t.time}] ${t.label}`),
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sermon-notes-${videoId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasContent = note.content || note.timestamps.length > 0;

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-sm">Sermon Notes</h3>
            <p className="text-xs text-muted-foreground">
              {hasContent
                ? `${note.content.length} chars · ${note.timestamps.length} markers`
                : "Take notes while you watch"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!saved && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 animate-pulse"
            >
              Saving...
            </Badge>
          )}
          {saved && hasContent && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 text-green-600 border-green-600/30"
            >
              Saved
            </Badge>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0 pb-4 px-4 space-y-4">
              {/* Note Title */}
              <Input
                placeholder="Note title (e.g., Sunday Sermon - Faith)"
                value={note.title}
                onChange={(e) => updateNote({ title: e.target.value })}
                className="font-medium border-0 bg-muted/50 focus-visible:ring-primary/30"
              />

              {/* Main Notes Area */}
              <Textarea
                placeholder="Start taking notes...&#10;&#10;• Key points&#10;• Scripture references&#10;• Personal reflections"
                value={note.content}
                onChange={(e) => updateNote({ content: e.target.value })}
                className="min-h-[180px] resize-y border-0 bg-muted/50 focus-visible:ring-primary/30 text-sm leading-relaxed"
              />

              {/* Timestamp Markers */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Key Moments
                  </span>
                </div>

                {note.timestamps.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {note.timestamps.map((t, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="group flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1"
                      >
                        <span className="text-[11px] font-mono text-primary">
                          {t.time}
                        </span>
                        <span className="text-xs">{t.label}</span>
                        <button
                          onClick={() => removeTimestamp(i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
                        >
                          <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Add a key moment (e.g., Main scripture reference)"
                    value={newTimestamp}
                    onChange={(e) => setNewTimestamp(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTimestamp()}
                    className="text-sm border-0 bg-muted/50 focus-visible:ring-primary/30"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addTimestamp}
                    disabled={!newTimestamp.trim()}
                    className="shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <p className="text-[11px] text-muted-foreground">
                  Notes are saved locally on this device
                </p>
                <div className="flex gap-1.5">
                  {hasContent && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={exportNote}
                        className="h-8 text-xs gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearNote}
                        className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
