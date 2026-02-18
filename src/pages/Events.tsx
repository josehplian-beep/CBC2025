import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar as CalendarIcon, Clock, MapPin, Users, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Download, Upload, Share2, Maximize2, Minimize2, Eye, Facebook, Twitter, Instagram, Link2 } from "lucide-react";
import { format, isSameDay, parseISO, startOfWeek, endOfWeek } from "date-fns";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullscreenCalendar, setFullscreenCalendar] = useState(false);
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
        // Parse date in UTC to avoid timezone shifts on calendar
        const utcDate = e.date_obj.split('T')[0]; // Get YYYY-MM-DD
        const [year, month, day] = utcDate.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day); // Local date object with correct calendar date
        return {
          ...e,
          dateObj
        };
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
    // Generate ICS file for calendar apps
    const startDate = format(event.dateObj, "yyyyMMdd");
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Chin Bethel Church//Events//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@chinbethelchurch.com`,
      `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
      `DTSTART:${startDate}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location}`,
      'END:VEVENT',
      'END:VCALENDAR'
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

  let filteredEvents = events;
  
  // Filter by time (upcoming vs all) - default to upcoming
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (timeFilter === "upcoming") {
    filteredEvents = filteredEvents.filter(event => event.dateObj >= today);
  }
  
  // Filter by date
  if (weekFilter) {
    const weekStart = startOfWeek(weekFilter, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(weekFilter, { weekStartsOn: 0 });
    filteredEvents = filteredEvents.filter(event => 
      event.dateObj >= weekStart && event.dateObj <= weekEnd
    );
  } else if (selectedDate) {
    filteredEvents = filteredEvents.filter(event => isSameDay(event.dateObj, selectedDate));
  }
  
  // Filter by event type
  if (eventTypeFilter !== "all") {
    filteredEvents = filteredEvents.filter(event => event.type === eventTypeFilter);
  }

  const upcomingEvents = events
    .filter(event => event.dateObj >= new Date())
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .slice(0, 5);

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[200px] flex items-center justify-center overflow-hidden mt-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="relative z-10 text-center text-primary-foreground px-4">
          <CalendarIcon className="w-12 h-12 mx-auto mb-3" />
          <h1 className="font-display text-4xl md:text-5xl font-bold">Church Calendar</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreenCalendar(!fullscreenCalendar)}
            className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {fullscreenCalendar ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
            {fullscreenCalendar ? 'Exit' : 'Expand'} Calendar View
          </Button>
        </div>
      </section>

      {/* Fullscreen Calendar View */}
      {fullscreenCalendar && (
        <section className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">Calendar View</h2>
              <Button onClick={() => setFullscreenCalendar(false)}>
                <Minimize2 className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8">
              {/* Large Calendar */}
              <Card className="p-4 md:p-8 shadow-md border border-border/60 rounded-2xl">
                <div className="flex items-center justify-center min-h-[500px]">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setWeekFilter(undefined);
                    }}
                    className="rounded-xl w-full max-w-2xl"
                    modifiers={{
                      hasEvent: eventDates
                    }}
                    modifiersClassNames={{
                      hasEvent: "relative font-medium after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary"
                    }}
                  />
                </div>
              </Card>

              {/* Events Slider */}
              <Card className="border-2 shadow-xl max-h-[600px] overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 sticky top-0 z-10">
                  <CardTitle>
                    {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : 'All Events'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-y-auto max-h-[520px] space-y-3 p-4">
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">No events found</p>
                    </div>
                  ) : (
                    filteredEvents.map((event, index) => (
                      <Card key={index} className="hover:shadow-lg transition-all duration-200 border-2">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold">{event.title}</h3>
                            <div className="flex items-center gap-1">
                              <Badge className={typeColors[event.type]}>{event.type}</Badge>
                              {(event.is_recurring_parent || event.parent_event_id) && (
                                <Badge variant="outline" className="text-xs">🔄</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-3 h-3" />
                              {event.date}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {event.time}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setViewingEvent(event);
                                setViewEventDialog(true);
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Event
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <Share2 className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => shareEventToCalendar(event)}>
                                  <CalendarIcon className="w-4 h-4 mr-2" />
                                  Add to Calendar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => shareEventToFacebook(event)}>
                                  <Facebook className="w-4 h-4 mr-2" />
                                  Share to Facebook
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => shareEventToTwitter(event)}>
                                  <Twitter className="w-4 h-4 mr-2" />
                                  Share to Twitter
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={shareEventToInstagram}>
                                  <Instagram className="w-4 h-4 mr-2" />
                                  Share to Instagram
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={copyEventLink}>
                                  <Link2 className="w-4 h-4 mr-2" />
                                  Copy Link
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Main Content with Sidebar */}
      <section className={`py-8 bg-background ${fullscreenCalendar ? 'hidden' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <aside 
              className={`
                lg:sticky lg:top-24 lg:h-fit
                transition-all duration-300 ease-in-out
                ${sidebarOpen ? 'lg:w-[340px]' : 'lg:w-0 lg:overflow-hidden'}
              `}
            >
              <div className={`
                transition-opacity duration-300 space-y-4
                ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-0'}
              `}>
                {/* Calendar Card */}
                <Card className="animate-fade-in shadow-md border border-border/60 rounded-2xl overflow-hidden">
                  <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <CalendarIcon className="w-4 h-4" />
                      Select Date
                    </span>
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="lg:inline-flex hidden p-1.5 hover:bg-accent rounded-full transition-colors duration-200"
                    >
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <CardContent className="p-2 md:p-3">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setWeekFilter(undefined);
                      }}
                      className="rounded-xl mx-auto w-full"
                      modifiers={{
                        hasEvent: eventDates
                      }}
                      modifiersClassNames={{
                        hasEvent: "relative font-medium after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary"
                      }}
                    />
                    <div className="mt-3 space-y-1.5 px-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full rounded-xl text-xs h-9 hover:bg-primary/10 border-border/60 transition-colors duration-200"
                        onClick={() => {
                          setWeekFilter(new Date());
                          setSelectedDate(undefined);
                        }}
                      >
                        <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                        This Week
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full rounded-xl text-xs h-9 text-muted-foreground hover:text-foreground transition-colors duration-200"
                        onClick={() => {
                          setSelectedDate(undefined);
                          setWeekFilter(undefined);
                        }}
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Events Card */}
                <Card className="animate-fade-in shadow-md border border-border/60 rounded-2xl overflow-hidden" style={{ animationDelay: '0.1s' }}>
                  <div className="px-4 pt-4 pb-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Upcoming
                    </span>
                  </div>
                  <CardContent className="px-3 pb-3 space-y-1.5">
                    {upcomingEvents.map((event, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedDate(event.dateObj)}
                        className="p-2.5 rounded-xl border border-transparent hover:border-border hover:bg-accent/30 cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-medium text-sm line-clamp-1">{event.title}</p>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 shrink-0 rounded-md">
                            {event.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground/70">
                          {format(event.dateObj, 'MMM dd, yyyy')}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </aside>

            {/* Toggle Button for Collapsed Sidebar */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-primary text-primary-foreground rounded-r-lg shadow-lg hover:scale-110 transition-transform"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Events Content */}
            <div className="flex-1">
              {isAdmin && (
                <Card className="mb-6 p-4 border-2 shadow-lg bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => { setSelectedEvent(null); setDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Event
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </Button>
                    <Button variant="outline" onClick={() => document.getElementById('excel-import')?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Excel
                    </Button>
                    <input
                      id="excel-import"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </div>
                </Card>
              )}

              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold">
                    {weekFilter 
                      ? `Week of ${format(startOfWeek(weekFilter, { weekStartsOn: 0 }), 'MMM dd, yyyy')}`
                      : selectedDate 
                      ? format(selectedDate, 'MMMM dd, yyyy') 
                      : 'All Events'}
                  </h2>
                  <p className="text-muted-foreground">
                    {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Time filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="all">All Events</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by type" />
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
                  {(selectedDate || weekFilter || eventTypeFilter !== "all" || timeFilter !== "upcoming") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedDate(undefined);
                        setWeekFilter(undefined);
                        setEventTypeFilter("all");
                        setTimeFilter("upcoming");
                      }}
                      className="transition-all hover:scale-105"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <Card className="p-12 text-center animate-fade-in">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no events scheduled for this date.
                  </p>
                  <Button onClick={() => setSelectedDate(undefined)}>
                    View All Events
                  </Button>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredEvents.map((event, index) => (
                    <Card 
                      key={index} 
                      className="hover:shadow-xl transition-all duration-300 animate-fade-in border-2 hover:border-primary/50 overflow-hidden"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Event Image */}
                        <div className="sm:w-64 h-48 sm:h-auto flex-shrink-0 bg-muted relative overflow-hidden">
                          {event.image_url ? (
                            <img 
                              src={event.image_url} 
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                              <CalendarIcon className="w-16 h-16 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge className={`${typeColors[event.type]}`}>{event.type}</Badge>
                                {(event.is_recurring_parent || event.parent_event_id) && (
                                  <Badge variant="outline" className="text-xs">
                                    🔄 Recurring
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground">
                                {event.title}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <CalendarIcon className="w-4 h-4 text-primary" />
                            <span className="font-medium">{event.date}</span>
                            {event.recurring_pattern && event.recurring_pattern !== 'none' && (
                              <span className="text-xs">
                                • Repeats {event.recurring_pattern}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4 items-center">
                            <Button 
                              variant="outline"
                              size="default"
                              onClick={() => {
                                setViewingEvent(event);
                                setViewEventDialog(true);
                              }}
                            >
                              VIEW EVENT
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Share
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => shareEventToCalendar(event)}>
                                  <CalendarIcon className="w-4 h-4 mr-2" />
                                  Add to Calendar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => shareEventToFacebook(event)}>
                                  <Facebook className="w-4 h-4 mr-2" />
                                  Share to Facebook
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => shareEventToTwitter(event)}>
                                  <Twitter className="w-4 h-4 mr-2" />
                                  Share to Twitter
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={shareEventToInstagram}>
                                  <Instagram className="w-4 h-4 mr-2" />
                                  Share to Instagram
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={copyEventLink}>
                                  <Link2 className="w-4 h-4 mr-2" />
                                  Copy Link
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {isAdmin && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setEventToDelete(event);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <Users className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Want to Stay Updated?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter to receive weekly updates about upcoming events and church news.
          </p>
          <Button size="lg" className="transition-all hover:scale-105">
            Subscribe to Newsletter
          </Button>
        </div>
      </section>

      {/* View Event Dialog */}
      <AlertDialog open={viewEventDialog} onOpenChange={setViewEventDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">{viewingEvent?.title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 text-base">
                  <Badge className={typeColors[viewingEvent?.type]}>{viewingEvent?.type}</Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Date</p>
                      <p className="text-muted-foreground">{viewingEvent?.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Time</p>
                      <p className="text-muted-foreground">{viewingEvent?.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Location</p>
                      <p className="text-muted-foreground">{viewingEvent?.location}</p>
                    </div>
                  </div>
                </div>

                {viewingEvent?.description && (
                  <div className="pt-4 border-t">
                    <p className="font-semibold mb-2">Description</p>
                    <p className="text-muted-foreground">{viewingEvent.description}</p>
                  </div>
                )}

                {viewingEvent?.image_url && (
                  <div className="pt-4">
                    <img 
                      src={viewingEvent.image_url} 
                      alt={viewingEvent.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Event
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => shareEventToCalendar(viewingEvent)}>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Add to Calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareEventToFacebook(viewingEvent)}>
                  <Facebook className="w-4 h-4 mr-2" />
                  Share to Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareEventToTwitter(viewingEvent)}>
                  <Twitter className="w-4 h-4 mr-2" />
                  Share to Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareEventToInstagram}>
                  <Instagram className="w-4 h-4 mr-2" />
                  Share to Instagram
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyEventLink}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogCancel>Close</AlertDialogCancel>
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
