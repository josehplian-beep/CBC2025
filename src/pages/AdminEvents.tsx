import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, Plus, Edit, Trash2, MapPin, Clock, Image as ImageIcon, X, CheckSquare, Download, Upload, Search, Copy, Filter, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import * as XLSX from "xlsx";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  date_obj: string;
  time: string;
  location: string;
  type: string;
  image_url?: string;
  recurring_pattern?: string;
  recurring_end_date?: string;
  is_recurring_parent?: boolean;
}

const AdminEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    type: "Worship",
    image_url: "",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date_obj", { ascending: false });

    if (!error && data) {
      setEvents(data);
    } else if (error) {
      toast.error("Failed to load events");
    }
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
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

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url || null;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `event-${Math.random()}.${fileExt}`;
    const { error: uploadError, data } = await supabase.storage
      .from("albums")
      .upload(fileName, imageFile);

    if (uploadError) {
      toast.error("Failed to upload image");
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("albums")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const imageUrl = await uploadImage();
      
      const eventDate = new Date(formData.date);
      const dateString = format(eventDate, "MMMM dd, yyyy");

      const eventData = {
        title: formData.title,
        description: formData.description,
        date: dateString,
        date_obj: eventDate.toISOString(),
        time: formData.time,
        location: formData.location,
        type: formData.type,
        image_url: imageUrl,
      };

      if (selectedEvent) {
        const { error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", selectedEvent.id);

        if (error) throw error;
        toast.success("Event updated successfully");
      } else {
        const { error } = await supabase
          .from("events")
          .insert([eventData]);

        if (error) throw error;
        toast.success("Event created successfully");
      }

      resetForm();
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message || "Failed to save event");
    }
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      date: event.date_obj.split("T")[0],
      time: event.time,
      location: event.location,
      type: event.type,
      image_url: event.image_url || "",
    });
    setImagePreview(event.image_url || "");
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventToDelete.id);

      if (error) throw error;

      toast.success("Event deleted successfully");
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete event");
    } finally {
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEventIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .in("id", selectedEventIds);

      if (error) throw error;

      toast.success(`${selectedEventIds.length} event(s) deleted successfully`);
      setSelectedEventIds([]);
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete events");
    } finally {
      setBulkDeleteDialogOpen(false);
    }
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEventIds.length === filteredEvents.length) {
      setSelectedEventIds([]);
    } else {
      setSelectedEventIds(filteredEvents.map(e => e.id));
    }
  };

  const handleExport = () => {
    const exportData = events.map(event => ({
      'Title': event.title,
      'Description': event.description || '',
      'Date': event.date,
      'Time': event.time,
      'Location': event.location,
      'Type': event.type,
      'Image URL': event.image_url || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Events');
    
    // Auto-size columns
    const maxWidth = 50;
    const wscols = Object.keys(exportData[0] || {}).map(() => ({ wch: maxWidth }));
    ws['!cols'] = wscols;
    
    XLSX.writeFile(wb, `CBC_Events_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Events exported successfully');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

          if (jsonData.length === 0) {
            toast.error('No data found in the file');
            return;
          }

          // Validate required fields
          const requiredFields = ['Title', 'Date', 'Time', 'Location', 'Type'];
          const firstRow = jsonData[0];
          const missingFields = requiredFields.filter(field => !(field in firstRow));
          
          if (missingFields.length > 0) {
            toast.error(`Missing required columns: ${missingFields.join(', ')}`);
            return;
          }

          // Process and insert events
          const eventsToInsert = jsonData.map((row: any) => {
            const eventDate = new Date(row['Date']);
            const dateString = format(eventDate, "MMMM dd, yyyy");
            
            return {
              title: row['Title'],
              description: row['Description'] || null,
              date: dateString,
              date_obj: eventDate.toISOString(),
              time: row['Time'],
              location: row['Location'],
              type: row['Type'],
              image_url: row['Image URL'] || null,
            };
          });

          const { error } = await supabase
            .from('events')
            .insert(eventsToInsert);

          if (error) throw error;

          toast.success(`Successfully imported ${eventsToInsert.length} event(s)`);
          fetchEvents();
        } catch (error: any) {
          console.error('Import error:', error);
          toast.error(error.message || 'Failed to import events');
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast.error(error.message || 'Failed to read file');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      type: "Worship",
      image_url: "",
    });
    setSelectedEvent(null);
    setImageFile(null);
    setImagePreview("");
    setDialogOpen(false);
  };

  const filteredEvents = events
    .filter(e => {
      const matchesType = typeFilter === "all" || e.type === typeFilter;
      const matchesSearch = searchQuery === "" || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesDate = true;
      const eventDate = new Date(e.date_obj);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateFilter === "upcoming") {
        matchesDate = eventDate >= today;
      } else if (dateFilter === "past") {
        matchesDate = eventDate < today;
      }
      
      return matchesType && matchesSearch && matchesDate;
    });

  const eventTypes = Array.from(new Set(events.map(e => e.type)));

  const getEventStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = events.filter(e => new Date(e.date_obj) >= today).length;
    const past = events.filter(e => new Date(e.date_obj) < today).length;
    const thisMonth = events.filter(e => {
      const eventDate = new Date(e.date_obj);
      return eventDate.getMonth() === today.getMonth() && 
             eventDate.getFullYear() === today.getFullYear();
    }).length;
    
    return { total: events.length, upcoming, past, thisMonth };
  };

  const stats = getEventStats();

  const handleDuplicate = (event: Event) => {
    setSelectedEvent(null);
    setFormData({
      title: `${event.title} (Copy)`,
      description: event.description || "",
      date: "",
      time: event.time,
      location: event.location,
      type: event.type,
      image_url: event.image_url || "",
    });
    setImagePreview(event.image_url || "");
    setDialogOpen(true);
  };

  const isUpcoming = (dateObj: string) => {
    const eventDate = new Date(dateObj);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-background">
      <div className="bg-gradient-to-r from-primary via-accent to-primary p-8 mb-6 rounded-b-2xl shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-display font-bold text-primary-foreground">Manage Events</h1>
              <p className="text-primary-foreground/80 text-lg">Create, edit, and manage all church events</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleExport} 
                className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 border-0"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 border-0"
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={resetForm} 
                    size="lg"
                    className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg"
                  >
                    <Plus className="h-5 w-5" />
                    Add Event
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 bg-primary-foreground/95 backdrop-blur-sm shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Events</p>
                    <p className="text-3xl font-bold text-primary">{stats.total}</p>
                  </div>
                  <Calendar className="h-10 w-10 text-primary/30" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-primary-foreground/95 backdrop-blur-sm shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Upcoming</p>
                    <p className="text-3xl font-bold text-primary">{stats.upcoming}</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-primary/30" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-primary-foreground/95 backdrop-blur-sm shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">This Month</p>
                    <p className="text-3xl font-bold text-primary">{stats.thisMonth}</p>
                  </div>
                  <Calendar className="h-10 w-10 text-primary/30" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-primary-foreground/95 backdrop-blur-sm shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Past Events</p>
                    <p className="text-3xl font-bold text-muted-foreground">{stats.past}</p>
                  </div>
                  <Clock className="h-10 w-10 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="pb-6 border-b">
            <DialogTitle className="text-3xl font-display">
              {selectedEvent ? "Edit Event" : "Create New Event"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-medium">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="h-12 text-lg rounded-xl border-2"
                placeholder="Enter event title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-medium">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="rounded-xl border-2 resize-none"
                placeholder="Describe the event..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-base font-medium">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="h-12 rounded-xl border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-base font-medium">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                  className="h-12 rounded-xl border-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-base font-medium">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Church address or online link"
                required
                className="h-12 rounded-xl border-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-base font-medium">Event Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="h-12 rounded-xl border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="Worship">Worship</SelectItem>
                  <SelectItem value="Youth">Youth</SelectItem>
                  <SelectItem value="Children">Children</SelectItem>
                  <SelectItem value="Study">Study</SelectItem>
                  <SelectItem value="Deacon">Deacon</SelectItem>
                  <SelectItem value="Mission">Mission</SelectItem>
                  <SelectItem value="Building Committee">Building Committee</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Culture">Culture</SelectItem>
                  <SelectItem value="CBCUSA">CBCUSA</SelectItem>
                  <SelectItem value="Special">Special</SelectItem>
                  <SelectItem value="Outreach">Outreach</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-base font-medium">Event Image</Label>
              <div className="border-2 border-dashed rounded-xl p-4 hover:border-primary/50 transition-colors">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Max file size: 5MB. Recommended: 1200x600px
                </p>
              </div>
              {imagePreview && (
                <div className="mt-4 relative rounded-xl overflow-hidden border-2">
                  <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-3 rounded-xl shadow-lg"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview("");
                      setFormData({ ...formData, image_url: "" });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
                className="h-12 px-6 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-accent"
              >
                {selectedEvent ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        {/* Search and Filters */}
        <Card className="border-2 rounded-2xl overflow-hidden bg-gradient-to-br from-card to-secondary/20 shadow-lg">
          <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search events by title, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg rounded-xl border-2"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[200px] h-14 rounded-xl border-2">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">All Types</SelectItem>
                  {eventTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-[200px] h-14 rounded-xl border-2">
                  <SelectValue placeholder="Date Filter" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past Events</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedEventIds.length > 0 && (
          <Card className="border-2 border-primary/30 rounded-2xl overflow-hidden bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CheckSquare className="h-6 w-6 text-primary" />
                  <span className="text-lg font-semibold">
                    {selectedEventIds.length} event{selectedEventIds.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                    className="gap-2 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedEventIds([])}
                    className="rounded-xl"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
            <p className="text-muted-foreground mt-4">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="border-2 rounded-2xl overflow-hidden bg-gradient-to-br from-card to-secondary/20">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                <Calendar className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || typeFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your filters or search query"
                  : "Create your first event to get started!"}
              </p>
              {!searchQuery && typeFilter === "all" && dateFilter === "all" && (
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Event
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {filteredEvents.length > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border-2">
                <Checkbox
                  checked={selectedEventIds.length === filteredEvents.length && filteredEvents.length > 0}
                  onCheckedChange={toggleSelectAll}
                  id="select-all"
                />
                <Label htmlFor="select-all" className="cursor-pointer font-medium">
                  Select all {filteredEvents.length} event{filteredEvents.length > 1 ? 's' : ''}
                </Label>
              </div>
            )}
            <div className="grid gap-4">
              {filteredEvents.map((event) => (
                <Card 
                  key={event.id} 
                  className="group border-2 rounded-2xl overflow-hidden bg-gradient-to-br from-card via-card to-secondary/20 hover:shadow-2xl hover:border-primary/30 transition-all duration-300"
                >
                  <div className={`h-1.5 bg-gradient-to-r ${isUpcoming(event.date_obj) ? 'from-primary via-accent to-primary' : 'from-muted to-muted-foreground'}`}></div>
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <div className="flex items-start pt-1">
                        <Checkbox
                          checked={selectedEventIds.includes(event.id)}
                          onCheckedChange={() => toggleEventSelection(event.id)}
                          className="h-5 w-5"
                        />
                      </div>
                      {event.image_url && (
                        <div className="flex-shrink-0">
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-40 h-40 object-cover rounded-xl border-2 shadow-md group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-display text-2xl font-bold group-hover:text-primary transition-colors">{event.title}</h3>
                              {isUpcoming(event.date_obj) && (
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground animate-pulse">
                                  Upcoming
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                                <Calendar className="h-4 w-4 text-accent" />
                                <span className="font-medium">{event.date}</span>
                              </span>
                              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                                <Clock className="h-4 w-4 text-accent" />
                                <span className="font-medium">{event.time}</span>
                              </span>
                              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                                <MapPin className="h-4 w-4 text-accent" />
                                <span className="font-medium truncate max-w-[200px]">{event.location}</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDuplicate(event)}
                              title="Duplicate event"
                              className="rounded-xl hover:bg-primary hover:text-primary-foreground"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(event)}
                              title="Edit event"
                              className="rounded-xl hover:bg-primary hover:text-primary-foreground"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setEventToDelete(event);
                                setDeleteDialogOpen(true);
                              }}
                              title="Delete event"
                              className="rounded-xl hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                            {event.description}
                          </p>
                        )}
                        <div className="mt-4 flex items-center gap-2">
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20">
                            <Filter className="h-3 w-3" />
                            {event.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-display">Delete Event</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{eventToDelete?.title}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEventToDelete(null)} className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-display">Delete Multiple Events</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">{selectedEventIds.length} event{selectedEventIds.length > 1 ? 's' : ''}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Delete All Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminEvents;
