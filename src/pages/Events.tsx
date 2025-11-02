import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, MapPin, Users, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Download, Upload } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EventDialog } from "@/components/EventDialog";
import * as XLSX from "xlsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Events = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<any>(null);

  useEffect(() => {
    checkAdminStatus();
    fetchEvents();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      setIsAdmin(!!data);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date_obj", { ascending: true });

      if (error) throw error;
      
      const eventsWithDateObj = data.map(event => ({
        ...event,
        dateObj: new Date(event.date_obj)
      }));
      
      setEvents(eventsWithDateObj);
    } catch (error: any) {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;
    
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", deletingEvent.id);

      if (error) throw error;
      
      toast.success("Event deleted successfully");
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleteDialogOpen(false);
      setDeletingEvent(null);
    }
  };

  const handleExport = () => {
    const exportData = events.map(event => ({
      "Event Name": event.title,
      "Date": event.date,
      "Event Type": event.type,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Events");
    XLSX.writeFile(wb, `church-events-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Events exported successfully");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const eventsToImport = data.map((row: any) => ({
          title: row["Event Name"],
          date: row["Date"],
          date_obj: new Date(row["Date"]).toISOString(),
          time: "TBA",
          location: "To be announced",
          type: row["Event Type"],
          description: "",
        }));

        const { error } = await supabase.from("events").insert(eventsToImport);
        
        if (error) throw error;
        
        toast.success(`${eventsToImport.length} events imported successfully`);
        fetchEvents();
      } catch (error: any) {
        toast.error("Failed to import events: " + error.message);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const filteredEvents = selectedDate
    ? events.filter(event => isSameDay(event.dateObj, selectedDate))
    : events;

  const upcomingEvents = events
    .filter(event => event.dateObj >= new Date())
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .slice(0, 5);

  const typeColors: Record<string, string> = {
    Worship: "bg-primary text-primary-foreground",
    Youth: "bg-accent text-accent-foreground",
    Study: "bg-secondary text-secondary-foreground",
    Outreach: "bg-destructive text-destructive-foreground",
    Special: "bg-primary text-primary-foreground",
    Children: "bg-accent text-accent-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[200px] flex items-center justify-center overflow-hidden mt-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="relative z-10 text-center text-primary-foreground px-4">
          <CalendarIcon className="w-12 h-12 mx-auto mb-3" />
          <h1 className="font-display text-4xl md:text-5xl font-bold">Church Calendar</h1>
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <aside 
              className={`
                lg:sticky lg:top-24 lg:h-fit
                transition-all duration-300 ease-in-out
                ${sidebarOpen ? 'lg:w-80' : 'lg:w-0 lg:overflow-hidden'}
              `}
            >
              <div className={`
                transition-opacity duration-300
                ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-0'}
              `}>
                <Card className="mb-6 animate-fade-in">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Select Date</span>
                      <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:inline-flex hidden p-1 hover:bg-muted rounded transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border pointer-events-auto"
                      modifiers={{
                        hasEvent: events.map(e => e.dateObj)
                      }}
                      modifiersStyles={{
                        hasEvent: {
                          fontWeight: 'bold',
                          backgroundColor: '#FF8F8F',
                          color: 'white',
                          borderRadius: '4px'
                        }
                      }}
                    />
                  </CardContent>
                </Card>

                <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <CardHeader>
                    <CardTitle className="text-lg">Upcoming Events</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingEvents.map((event, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedDate(event.dateObj)}
                        className="p-3 rounded-lg border hover:bg-muted cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-sm line-clamp-1">{event.title}</p>
                          <Badge className={`${typeColors[event.type]} text-xs`}>
                            {event.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
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
              <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold">
                    {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : 'All Events'}
                  </h2>
                  <p className="text-muted-foreground">
                    {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {selectedDate && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDate(undefined)}
                      className="transition-all hover:scale-105"
                    >
                      Clear Filter
                    </Button>
                  )}
                  {isAdmin && (
                    <>
                      <Button
                        onClick={() => {
                          setEditingEvent(null);
                          setDialogOpen(true);
                        }}
                        className="transition-all hover:scale-105"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Event
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleExport}
                        className="transition-all hover:scale-105"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('import-file')?.click()}
                        className="transition-all hover:scale-105"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                      </Button>
                      <input
                        id="import-file"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleImport}
                        className="hidden"
                      />
                    </>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredEvents.map((event, index) => (
                    <Card 
                      key={index} 
                      className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-xl font-display">{event.title}</CardTitle>
                          <Badge className={typeColors[event.type]}>{event.type}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground">{event.description}</p>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <CalendarIcon className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                            <span>{event.location}</span>
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingEvent(event);
                                setDialogOpen(true);
                              }}
                              className="flex-1"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDeletingEvent(event);
                                setDeleteDialogOpen(true);
                              }}
                              className="flex-1"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </CardContent>
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

      <Footer />

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        onSuccess={fetchEvents}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingEvent?.title}"? This action cannot be undone.
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
    </div>
  );
};

export default Events;
