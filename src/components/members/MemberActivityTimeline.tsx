import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FileText, MessageSquare, UserCircle, Upload, Clock, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "note" | "file" | "update";
  title: string;
  description?: string;
  timestamp: string;
  author?: string;
}

interface MemberActivityTimelineProps {
  memberId: string;
  memberUpdatedAt?: string | null;
}

export function MemberActivityTimeline({ memberId, memberUpdatedAt }: MemberActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [memberId]);

  const loadActivities = async () => {
    try {
      const [notesResult, filesResult] = await Promise.all([
        supabase
          .from("member_notes")
          .select(`
            id,
            content,
            created_at,
            created_by,
            profiles!member_notes_created_by_fkey(full_name)
          `)
          .eq("member_id", memberId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("member_files")
          .select(`
            id,
            file_name,
            description,
            created_at,
            uploaded_by,
            profiles!member_files_uploaded_by_fkey(full_name)
          `)
          .eq("member_id", memberId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const activityItems: ActivityItem[] = [];

      // Add notes
      if (notesResult.data) {
        notesResult.data.forEach((note: any) => {
          activityItems.push({
            id: `note-${note.id}`,
            type: "note",
            title: "Note added",
            description: note.content.length > 100 
              ? note.content.substring(0, 100) + "..." 
              : note.content,
            timestamp: note.created_at,
            author: note.profiles?.full_name || "Unknown",
          });
        });
      }

      // Add files
      if (filesResult.data) {
        filesResult.data.forEach((file: any) => {
          activityItems.push({
            id: `file-${file.id}`,
            type: "file",
            title: "File uploaded",
            description: file.file_name,
            timestamp: file.created_at,
            author: file.profiles?.full_name || "Unknown",
          });
        });
      }

      // Add profile update if available
      if (memberUpdatedAt) {
        activityItems.push({
          id: "update-profile",
          type: "update",
          title: "Profile updated",
          description: "Member profile was modified",
          timestamp: memberUpdatedAt,
        });
      }

      // Sort by timestamp descending
      activityItems.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(activityItems.slice(0, 15));
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "note":
        return MessageSquare;
      case "file":
        return Upload;
      case "update":
        return UserCircle;
      default:
        return Clock;
    }
  };

  const getIconStyle = (type: ActivityItem["type"]) => {
    switch (type) {
      case "note":
        return "bg-blue-500/10 text-blue-500";
      case "file":
        return "bg-green-500/10 text-green-500";
      case "update":
        return "bg-amber-500/10 text-amber-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 opacity-50" />
            </div>
            <p className="font-medium">No activity yet</p>
            <p className="text-sm mt-1">Activities will appear here as they happen</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-3 bottom-3 w-px bg-border" />
            
            <div className="space-y-1">
              {activities.map((activity, index) => {
                const Icon = getIcon(activity.type);
                const iconStyle = getIconStyle(activity.type);
                
                return (
                  <div 
                    key={activity.id}
                    className="relative flex gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors group"
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${iconStyle}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{activity.title}</p>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {activity.description}
                            </p>
                          )}
                          {activity.author && (
                            <p className="text-xs text-muted-foreground mt-1">
                              by {activity.author}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {format(new Date(activity.timestamp), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
