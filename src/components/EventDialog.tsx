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
import { formatEventRange, parseDay } from "@/lib/event-dates";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: any;
  /** Pre-fill a new event from an existing one (dates cleared). */
  duplicateFrom?: any;
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
  "Outreach"
];

const RECURRING_PATTERNS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

export const EventDialog = ({ open, onOpenChange, event, duplicateFrom, onSuccess }: EventDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    date: "",
    date_obj: "",
    time: "",
    location: "",
    type: "Worship",
    description: "",
    image_url: "",
    recurring_pattern: "none",
    recurring_end_date: "",
    end_date: "",
    end_time: ""
  });

  useEffect(() => {
    const source = event || duplicateFrom;
    if (source) {
      const copying = !event;
      setFormData({
        title: copying ? `${source.title} (Copy)` : source.title || "",
        slug: copying ? "" : source.slug || "",
        date: copying ? "" : source.date || "",
        date_obj: copying ? "" : source.date_obj?.split('T')[0] || "",
        end_date: copying ? "" : source.end_date || "",
        end_time: source.end_time || "",
        time: source.time || "",
        location: source.location || "",
        type: source.type || "Worship",
        description: source.description || "",
        image_url: source.image_url || "",
        recurring_pattern: copying ? "none" : source.recurring_pattern || "none",
        recurring_end_date: copying ? "" : source.recurring_end_date || ""
      });
      setImagePreview(source.image_url || '');
    } else {
      setFormData({
        title: "",
        slug: "",
        date: "",
        date_obj: "",
        time: "",
        location: "",
        type: "Worship",
        description: "",
        image_url: "",
        recurring_pattern: "none",
        recurring_end_date: "",
        end_date: "",
        end_time: ""
      });
      setImagePreview('');
    }
    setImageFile(null);
  }, [event, duplicateFrom, open]);

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

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

      const cleanSlug = formData.slug ? slugify(formData.slug) : null;
      // Parse YYYY-MM-DD as a LOCAL date at noon so the stored ISO never drifts to the previous/next day across timezones.
      const [yy, mm, dd] = formData.date_obj.split('-').map(Number);
      const localNoon = new Date(yy, mm - 1, dd, 12, 0, 0);
      // Keep the human-readable display date in sync with the calendar date.
      const endDate = formData.end_date && formData.end_date > formData.date_obj ? formData.end_date : null;
      const syncedDisplayDate = formatEventRange({ date_obj: formData.date_obj, end_date: endDate });
      const eventData = {
        ...formData,
        end_date: endDate,
        end_time: formData.end_time.trim() || null,
        date: syncedDisplayDate,
        slug: cleanSlug,
        date_obj: localNoon.toISOString(),
        image_url: imageUrl || null,
        recurring_pattern: formData.recurring_pattern !== 'none' ? formData.recurring_pattern : null,
        recurring_end_date: formData.recurring_pattern !== 'none' && formData.recurring_end_date 
          ? formData.recurring_end_date 
          : null,
        is_recurring_parent: formData.recurring_pattern !== 'none'
      };

      if (event) {
        const { error } = await supabase
          .from("events" as any)
          .update(eventData)
          .eq("id", event.id);
        
        if (error) throw error;

        // If it's a recurring event, regenerate instances
        if (formData.recurring_pattern !== 'none' && formData.recurring_end_date) {
          const { error: generateError } = await supabase.rpc('generate_recurring_events', {
            p_event_id: event.id,
            p_title: formData.title,
            p_description: formData.description || '',
            p_start_date: formData.date_obj,
            p_end_date: formData.recurring_end_date,
            p_time: formData.time,
            p_location: formData.location,
            p_type: formData.type,
            p_recurring_pattern: formData.recurring_pattern,
            p_image_url: imageUrl || null,
            p_created_by: null
          });

          if (generateError) {
            toast.error('Event updated but failed to generate recurring instances');
          } else {
            toast.success("Event and recurring instances updated successfully");
          }
        } else {
          toast.success("Event updated successfully");
        }
      } else {
        const { data: newEvent, error } = await supabase
          .from("events" as any)
          .insert([eventData])
          .select()
          .single();
        
        if (error) throw error;

        // Generate recurring instances if it's a recurring event
        if (formData.recurring_pattern !== 'none' && formData.recurring_end_date && newEvent && 'id' in newEvent) {
          const { error: generateError } = await supabase.rpc('generate_recurring_events', {
            p_event_id: newEvent.id as string,
            p_title: formData.title,
            p_description: formData.description || '',
            p_start_date: formData.date_obj,
            p_end_date: formData.recurring_end_date,
            p_time: formData.time,
            p_location: formData.location,
            p_type: formData.type,
            p_recurring_pattern: formData.recurring_pattern,
            p_image_url: imageUrl || null,
            p_created_by: null
          });

          if (generateError) {
            toast.error('Event created but failed to generate recurring instances');
          } else {
            toast.success("Event and recurring instances created successfully");
          }
        } else {
          toast.success("Event created successfully");
        }
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

            <div>
              <Label htmlFor="slug">Custom Short URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">/e/</span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  onBlur={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                  placeholder={formData.title ? slugify(formData.title) : "easter-sunday-2026"}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Leave blank to auto-generate from the title.</p>
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
                <Label htmlFor="date_obj">Start Date *</Label>
                <Input
                  id="date_obj"
                  type="date"
                  value={formData.date_obj}
                  onChange={(e) => {
                    const v = e.target.value;
                    const end = formData.end_date && formData.end_date > v ? formData.end_date : "";
                    const displayDate = v ? formatEventRange({ date_obj: v, end_date: end }) : formData.date;
                    setFormData({ ...formData, date_obj: v, end_date: end, date: displayDate });
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="end_date">End Date</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  min={formData.date_obj || undefined}
                  disabled={!formData.date_obj}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData({ ...formData, end_date: v, date: formatEventRange({ date_obj: formData.date_obj, end_date: v || null }) });
                  }}
                />
                {formData.end_date && (
                  <Button type="button" variant="ghost" size="sm"
                    onClick={() => setFormData({ ...formData, end_date: "", date: formatEventRange({ date_obj: formData.date_obj }) })}>
                    One day
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.end_date && formData.end_date > formData.date_obj
                  ? `Multi-day event: ${formatEventRange({ date_obj: formData.date_obj, end_date: formData.end_date })}`
                  : "Leave blank for a one-day event."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  placeholder="e.g., 3:00 PM"
                />
              </div>
              <div>
                <Label htmlFor="time">Start Time *</Label>
                <Input
                  id="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="e.g., 1:00 PM"
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
                <Label htmlFor="recurring_end_date">Repeat Until *</Label>
                <Input
                  id="recurring_end_date"
                  type="date"
                  value={formData.recurring_end_date}
                  onChange={(e) => setFormData({ ...formData, recurring_end_date: e.target.value })}
                  min={formData.date_obj}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  This will automatically create event instances from {formData.date_obj && format(parseDay(formData.date_obj), 'MMM d, yyyy')} until the end date.
                </p>
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