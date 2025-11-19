import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, User, Calendar, CheckCircle, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface PrayerRequestCardProps {
  id: string;
  title: string;
  content: string;
  author_name: string;
  is_anonymous: boolean;
  is_answered: boolean;
  created_at: string;
  author_id: string;
  currentUserId?: string;
  isAdmin?: boolean;
  onUpdate?: () => void;
}

const PrayerRequestCard = ({
  id,
  title,
  content,
  author_name,
  is_anonymous,
  is_answered,
  created_at,
  author_id,
  currentUserId,
  isAdmin,
  onUpdate,
}: PrayerRequestCardProps) => {
  const [praying, setPraying] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const isOwner = currentUserId === author_id;

  const handlePray = () => {
    setPraying(true);
    toast.success("Thank you for praying!");
    setTimeout(() => setPraying(false), 2000);
  };

  const handleMarkAnswered = async () => {
    try {
      const { error } = await supabase
        .from('prayer_requests')
        .update({ is_answered: !is_answered })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(is_answered ? "Marked as unanswered" : "Marked as answered");
      onUpdate?.();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error updating prayer request:', error);
      }
      toast.error("Failed to update request");
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('prayer_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Prayer request deleted");
      onUpdate?.();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error deleting prayer request:', error);
      }
      toast.error("Failed to delete request");
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{author_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
            {is_answered && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Answered
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePray}
            className={praying ? "bg-primary/10" : ""}
          >
            <Heart className={`w-4 h-4 mr-2 ${praying ? "fill-current text-primary" : ""}`} />
            {praying ? "Praying..." : "I'll Pray"}
          </Button>
          
          {(isOwner || isAdmin) && (
            <div className="flex items-center gap-2">
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAnswered}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {is_answered ? "Mark Unanswered" : "Mark Answered"}
                </Button>
              )}
              {(isOwner || isAdmin) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prayer Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prayer request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PrayerRequestCard;
