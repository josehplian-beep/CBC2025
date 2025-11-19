import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PrayerRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const PrayerRequestDialog = ({ open, onOpenChange, onSuccess }: PrayerRequestDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_anonymous: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to submit a prayer request");
        return;
      }

      // Get user's name from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const authorName = formData.is_anonymous 
        ? "Anonymous" 
        : profile?.full_name || "Church Member";

      const { error } = await supabase
        .from('prayer_requests')
        .insert({
          title: formData.title.trim(),
          content: formData.content.trim(),
          author_id: user.id,
          author_name: authorName,
          is_anonymous: formData.is_anonymous,
        });

      if (error) throw error;

      toast.success("Prayer request submitted successfully");
      setFormData({ title: "", content: "", is_anonymous: false });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error submitting prayer request:', error);
      }
      toast.error("Failed to submit prayer request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Submit Prayer Request</DialogTitle>
          <DialogDescription>
            Share your prayer request with our church community. We will pray for you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Prayer Request Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Health, Family, Guidance"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Your Request *</Label>
            <Textarea
              id="content"
              placeholder="Share your prayer request in detail..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="resize-none"
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.content.length}/1000
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="anonymous" className="text-base">Submit Anonymously</Label>
              <p className="text-sm text-muted-foreground">
                Your name will not be shown with this request
              </p>
            </div>
            <Switch
              id="anonymous"
              checked={formData.is_anonymous}
              onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PrayerRequestDialog;
