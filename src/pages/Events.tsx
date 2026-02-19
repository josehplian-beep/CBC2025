import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus, Edit, Trash2, Download, Upload, Share2, Eye, Facebook, Twitter, Instagram, Link2 } from "lucide-react";
import { format, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { EventDialog } from "@/components/EventDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const Events = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [weekFilter, setWeekFilter] = useState<Date | undefined>();
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("upcoming");
  const [events, setEvents] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewEventDialog, setViewEventDialog] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<any>(null);

  useEffect(() => {
    checkAdminStatus();
    fetchEvents();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'administrator'
      });
      setIsAdmin(data || false);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events' as any)
      .select('*')
      .order('date_obj', { ascending: true });
    
    if (!error && data) {
      setEvents(data.map((e: any) => {
        const utcDate = e.date_obj.split('T')[0];
        const [year, month, day] = utcDate.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return { ...e, dateObj };
      }));
    }
    setLoading(false);
  };

  const handleExport = () => {
    const exportData = events.map(e => ({
      'Event Name': e.title,
      'Date': e.date,
      'Event Type': e.type
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Events');
    XLSX.writeFile(wb, `CBC_Events_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Events exported successfully');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        const eventsToInsert = jsonData.map((row: any) => ({
          title: row['Event Name'],
          date: row['Date'],
          date_obj: new Date(row['Date']).toISOString(),
          time: 'TBA',
          location: 'TBA',
          type: row['Event Type'],
          description: ''
        }));
        const { error } = await supabase.from('events' as any).insert(eventsToInsert);
        if (error) throw error;
        toast.success(`${eventsToInsert.length} events imported successfully`);
        fetchEvents();
      } catch (error: any) {
        toast.error(error.message || 'Failed to import events');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    const { error } = await supabase
      .from('events' as any)
      .delete()
      .eq('id', eventToDelete.id);
    if (error) {
      toast.error('Failed to delete event');
    } else {
      toast.success('Event deleted successfully');
      fetchEvents();
    }
    setDeleteDialogOpen(false);
    setEventToDelete(null);
  };

  const shareEventToCalendar = (event: any) => {
    const startDate = format(event.dateObj, "yyyyMMdd");
    const icsContent = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Chin Bethel Church//Events//EN',
      'BEGIN:VEVENT', `UID:${event.id}@chinbethelchurch.com`,
      `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
      `DTSTART:${startDate}`, `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ''}`, `LOCATION:${event.location}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Calendar event downloaded');
  };

  const shareEventToFacebook = (event: any) => {
    const url = encodeURIComponent(window.location.origin + '/events');
    const text = encodeURIComponent(`${event.title} - ${event.date} at ${event.time}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
  };

  const shareEventToTwitter = (event: any) => {
    const text = encodeURIComponent(`Join us for ${event.title} on ${event.date} at ${event.time}!`);
    const url = encodeURIComponent(window.location.origin + '/events');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareEventToInstagram = () => {
    toast.info('Instagram does not support direct link sharing. Link copied to clipboard!');
    navigator.clipboard.writeText(window.location.origin + '/events');
  };

  const copyEventLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/events');
    toast.success('Event link copied to clipboard');
  };

  const handleNativeShare = async (event: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `${event.title} — ${event.date} at ${event.time}, ${event.location}`,
          url: window.location.origin + '/events',
        });
      } catch {}
    } else {
      copyEventLink();
    }
  };

  // Filtering
  let filteredEvents = events;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (timeFilter === "upcoming") {
    filteredEvents = filteredEvents.filter(event => event.dateObj >= today);
  }
  if (weekFilter) {
    const weekStart = startOfWeek(weekFilter, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(weekFilter, { weekStartsOn: 0 });
    filteredEvents = filteredEvents.filter(event =>
      event.dateObj >= weekStart && event.dateObj <= weekEnd
    );
  } else if (selectedDate) {
    filteredEvents = filteredEvents.filter(event => isSameDay(event.dateObj, selectedDate));
  }
  if (eventTypeFilter !== "all") {
    filteredEvents = filteredEvents.filter(event => event.type === eventTypeFilter);
  }

  const upcomingEvents = events
    .filter(event => event.dateObj >= new Date())
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .slice(0, 4);

  const typeColors: Record<string, string> = {
    Worship: "bg-primary text-primary-foreground",
    Youth: "bg-accent text-accent-foreground",
    Children: "bg-accent text-accent-foreground",
    Study: "bg-secondary text-secondary-foreground",
    Deacon: "bg-primary/80 text-primary-foreground",
    Mission: "bg-destructive text-destructive-foreground",
    "Building Committee": "bg-secondary/80 text-secondary-foreground",
    Media: "bg-primary/60 text-primary-foreground",
    Culture: "bg-accent/80 text-accent-foreground",
    CBCUSA: "bg-primary text-primary-foreground",
    Special: "bg-primary text-primary-foreground",
    Outreach: "bg-muted text-muted-foreground",
  };

  const eventDates = events.map(e => e.dateObj);

  const ShareMenu = ({ event }: { event: any }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-accent/50">
          <Share2 className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleNativeShare(event)}>
          <Share2 className="w-4 h-4 mr-2" /> Quick Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareEventToCalendar(event)}>
          <CalendarIcon className="w-4 h-4 mr-2" /> Add to Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareEventToFacebook(event)}>
          <Facebook className="w-4 h-4 mr-2" /> Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareEventToTwitter(event)}>
          <Twitter className="w-4 h-4 mr-2" /> Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareEventToInstagram}>
          <Instagram className="w-4 h-4 mr-2" /> Instagram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyEventLink}>
          <Link2 className="w-4 h-4 mr-2" /> Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="relative mt-20 overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--accent)/0.15),transparent_60%)]" />
        <div className="relative z-10 container mx-auto px-4 py-16 text-center text-primary-foreground">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-80" />
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Events</h1>
            <p className="mt-2 text-primary-foreground/70 text-lg max-w-md mx-auto">
              Stay connected with what's happening at Chin Bethel Church
            </p>
          </motion.div>
        </div>
      </section>

      {/* Next Up — horizontal scroll of upcoming events */}
      {upcomingEvents.length > 0 && (
        <section className="border-b border-border/50 bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Next Up</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {upcomingEvents.map((event, i) => (
                <motion.button
                  key={event.id || i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => { setViewingEvent(event); setViewEventDialog(true); }}
                  className="flex-shrink-0 w-60 text-left rounded-xl border border-border/60 bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200"
                >
                  <Badge className={`${typeColors[event.type]} text-[10px] mb-2`}>{event.type}</Badge>
                  <p className="font-semibold text-sm line-clamp-1">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(event.dateObj, 'MMM dd, yyyy')}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Admin bar */}
          {isAdmin && (
            <Card className="mb-6 p-4 border border-border/60 bg-card">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => { setSelectedEvent(null); setDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> Add Event
                </Button>
                <Button size="sm" variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-1" /> Export
                </Button>
                <Button size="sm" variant="outline" onClick={() => document.getElementById('excel-import')?.click()}>
                  <Upload className="w-4 h-4 mr-1" /> Import
                </Button>
                <input id="excel-import" type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
              </div>
            </Card>
          )}

          <div className="grid lg:grid-cols-[300px_1fr] gap-8">
            {/* Sidebar — Calendar + Filters */}
            <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
              <Card className="rounded-2xl border border-border/60 overflow-hidden">
                <CardContent className="p-3">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => { setSelectedDate(date); setWeekFilter(undefined); }}
                    className="rounded-xl mx-auto w-full"
                    modifiers={{ hasEvent: eventDates }}
                    modifiersClassNames={{
                      hasEvent: "relative font-medium after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary"
                    }}
                  />
                  <div className="mt-3 space-y-1.5 px-1">
                    <Button
                      variant="outline" size="sm"
                      className="w-full rounded-xl text-xs h-8"
                      onClick={() => { setWeekFilter(new Date()); setSelectedDate(undefined); }}
                    >
                      This Week
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className="w-full rounded-xl text-xs h-8 text-muted-foreground"
                      onClick={() => { setSelectedDate(undefined); setWeekFilter(undefined); setEventTypeFilter("all"); setTimeFilter("upcoming"); }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <div className="space-y-2">
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="rounded-xl h-9 text-xs">
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="all">All Events</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger className="rounded-xl h-9 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
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
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </aside>

            {/* Event List */}
            <div>
              <div className="flex items-baseline justify-between mb-5">
                <div>
                  <h2 className="text-xl font-display font-bold">
                    {weekFilter
                      ? `Week of ${format(startOfWeek(weekFilter, { weekStartsOn: 0 }), 'MMM dd')}`
                      : selectedDate
                      ? format(selectedDate, 'MMMM dd, yyyy')
                      : 'All Events'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="text-center py-20">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground mb-3">No events found</p>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedDate(undefined); setWeekFilter(undefined); setEventTypeFilter("all"); }}>
                    View All
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((event, index) => (
                    <motion.div
                      key={event.id || index}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.2) }}
                    >
                      <Card className="group border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden">
                        <div className="flex flex-col sm:flex-row">
                          {/* Date chip */}
                          <div className="sm:w-24 flex-shrink-0 flex sm:flex-col items-center justify-center gap-1 p-4 bg-muted/40 text-center">
                            <span className="text-2xl font-bold text-primary">{format(event.dateObj, 'd')}</span>
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              {format(event.dateObj, 'MMM')}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <Badge className={`${typeColors[event.type]} text-[10px]`}>{event.type}</Badge>
                                  {(event.is_recurring_parent || event.parent_event_id) && (
                                    <Badge variant="outline" className="text-[10px]">🔄 Recurring</Badge>
                                  )}
                                </div>
                                <h3 className="font-display font-bold text-base sm:text-lg text-foreground line-clamp-1">
                                  {event.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {event.time}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {event.location}
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                <ShareMenu event={event} />
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-accent/50"
                                  onClick={() => { setViewingEvent(event); setViewEventDialog(true); }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {isAdmin && (
                                  <>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"
                                      onClick={() => { setSelectedEvent(event); setDialogOpen(true); }}>
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive"
                                      onClick={() => { setEventToDelete(event); setDeleteDialogOpen(true); }}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* View Event Dialog */}
      <AlertDialog open={viewEventDialog} onOpenChange={setViewEventDialog}>
        <AlertDialogContent className="max-w-lg rounded-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={typeColors[viewingEvent?.type]}>{viewingEvent?.type}</Badge>
            </div>
            <AlertDialogTitle className="text-xl font-display">{viewingEvent?.title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    <span>{viewingEvent?.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{viewingEvent?.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm col-span-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{viewingEvent?.location}</span>
                  </div>
                </div>
                {viewingEvent?.description && (
                  <p className="text-sm text-muted-foreground border-t border-border/50 pt-3">{viewingEvent.description}</p>
                )}
                {viewingEvent?.image_url && (
                  <img src={viewingEvent.image_url} alt={viewingEvent.title} className="w-full h-48 object-cover rounded-lg" />
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            {viewingEvent && <ShareMenu event={viewingEvent} />}
            <Button variant="outline" size="sm" onClick={() => viewingEvent && shareEventToCalendar(viewingEvent)}>
              <CalendarIcon className="w-3.5 h-3.5 mr-1" /> Add to Calendar
            </Button>
            <AlertDialogCancel className="mt-0">Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={selectedEvent}
        onSuccess={fetchEvents}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
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

      <Footer />
    </div>
  );
};

export default Events;
