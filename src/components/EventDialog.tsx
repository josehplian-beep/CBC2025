import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: any;
  onSuccess: () => void;
}

const EVENT_TYPES = [
  "Worship",
  "Youth",
  "Children",
  "Study",
  "Deacon",
  "Mission",
  "Building Committee",
  "Media",
  "Culture",
  "CBCUSA",
  "Special",
  "Others"
];

const RECURRING_PATTERNS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

export const EventDialog = ({ open, onOpenChange, event, onSuccess }: EventDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    date_obj: "",
    time: "",
    location: "",
    type: "Worship",
    description: "",
    image_url: "",
    recurring_pattern: "none",
    recurring_end_date: ""
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        date: event.date || "",
        date_obj: event.date_obj?.split('T')[0] || "",
        time: event.time || "",
        location: event.location || "",
        type: event.type || "Worship",
        description: event.description || "",
        image_url: event.image_url || "",
        recurring_pattern: event.recurring_pattern || "none",
        recurring_end_date: event.recurring_end_date || ""
      });
      setImagePreview(event.image_url || '');
    } else {
      setFormData({
        title: "",
        date: "",
        date_obj: "",
        time: "",
        location: "",
        type: "Worship",
        description: "",
        image_url: "",
        recurring_pattern: "none",
        recurring_end_date: ""
      });
      setImagePreview('');
    }
    setImageFile(null);
  }, [event, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.image_url;

      // Upload image if a new one was selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `event-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('albums')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('albums')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      const eventData = {
        ...formData,
        date_obj: new Date(formData.date_obj).toISOString(),
        image_url: imageUrl || null,
        recurring_pattern: formData.recurring_pattern !== 'none' ? formData.recurring_pattern : null,
        recurring_end_date: formData.recurring_pattern !== 'none' && formData.recurring_end_date 
          ? formData.recurring_end_date 
          : null
      };

      if (event) {
        const { error } = await supabase
          .from("events" as any)
          .update(eventData)
          .eq("id", event.id);
        
        if (error) throw error;
        toast.success("Event updated successfully");
      } else {
        const { error } = await supabase
          .from("events" as any)
          .insert([eventData]);
        
        if (error) throw error;
        toast.success("Event created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Add New Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Event Name *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Display Date *</Label>
                <Input
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  placeholder="e.g., Every Sunday or Nov 1, 2025"
                  required
                />
              </div>

              <div>
                <Label htmlFor="date_obj">Calendar Date *</Label>
                <Input
                  id="date_obj"
                  type="date"
                  value={formData.date_obj}
                  onChange={(e) => setFormData({ ...formData, date_obj: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="e.g., 1:00 PM - 3:00 PM"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Event Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Event Image</Label>
              <div className="flex flex-col gap-3">
                {imagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border-2">
                    <img src={imagePreview} alt="Event preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        setFormData({ ...formData, image_url: '' });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurring">Recurring Event</Label>
              <Select 
                value={formData.recurring_pattern} 
                onValueChange={(value) => setFormData({ ...formData, recurring_pattern: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRING_PATTERNS.map(pattern => (
                    <SelectItem key={pattern.value} value={pattern.value}>
                      {pattern.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.recurring_pattern !== 'none' && (
              <div className="space-y-2">
                <Label htmlFor="recurring_end_date">Repeat Until</Label>
                <Input
                  id="recurring_end_date"
                  type="date"
                  value={formData.recurring_end_date}
                  onChange={(e) => setFormData({ ...formData, recurring_end_date: e.target.value })}
                  min={formData.date_obj}
                />
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : event ? "Update Event" : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};