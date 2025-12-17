import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Class {
  id: string;
  class_name: string;
  description: string | null;
}

interface ClassPanelProps {
  classes: Class[];
  selectedClass: Class | null;
  onSelectClass: (cls: Class) => void;
  loading: boolean;
  onClassCreated: () => void;
}

export function ClassPanel({
  classes,
  selectedClass,
  onSelectClass,
  loading,
  onClassCreated,
}: ClassPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const filteredClasses = classes.filter((cls) =>
    cls.class_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      toast.error("Please enter a class name");
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.from("classes").insert({
        class_name: newClassName,
        description: newClassDescription || null,
      });

      if (error) throw error;

      toast.success("Class created successfully");
      setNewClassName("");
      setNewClassDescription("");
      setShowAddDialog(false);
      onClassCreated();
    } catch (error) {
      console.error("Error creating class:", error);
      toast.error("Failed to create class");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-72 border-r bg-card/50 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Classes</h2>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="className">Class Name</Label>
                  <Input
                    id="className"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g., Sunday School - Ages 5-7"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classDescription">Description (Optional)</Label>
                  <Textarea
                    id="classDescription"
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    placeholder="Brief description of the class..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleCreateClass}
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Class"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No classes found</p>
            </div>
          ) : (
            filteredClasses.map((cls) => (
              <Card
                key={cls.id}
                onClick={() => onSelectClass(cls)}
                className={cn(
                  "p-3 cursor-pointer transition-all hover:bg-accent/50",
                  selectedClass?.id === cls.id
                    ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                    : "hover:border-border/80"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      selectedClass?.id === cls.id
                        ? "bg-primary/20"
                        : "bg-muted"
                    )}
                  >
                    <BookOpen
                      className={cn(
                        "h-4 w-4",
                        selectedClass?.id === cls.id
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {cls.class_name}
                    </p>
                    {cls.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {cls.description}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
