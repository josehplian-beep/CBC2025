import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, MapPin, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";

const Events = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const events = [
    {
      title: "Sunday Worship Service",
      date: "Every Sunday",
      dateObj: new Date(2025, 10, 2),
      time: "1:00 PM - 3:00 PM",
      location: "Main Sanctuary",
      type: "Worship",
      description: "Join us for worship, prayer, and biblical teaching.",
    },
    {
      title: "Youth Group Meeting",
      date: "Every Friday",
      dateObj: new Date(2025, 10, 7),
      time: "6:00 PM - 8:00 PM",
      location: "Youth Center",
      type: "Youth",
      description: "Fun, fellowship, and faith-building activities for teens.",
    },
    {
      title: "Women's Bible Study",
      date: "Every Wednesday",
      dateObj: new Date(2025, 10, 5),
      time: "10:00 AM - 12:00 PM",
      location: "Fellowship Hall",
      type: "Study",
      description: "Deep dive into God's Word with fellow sisters in Christ.",
    },
    {
      title: "Bible Sunday",
      date: "October 19, 2025",
      dateObj: new Date(2025, 9, 19),
      time: "TBA",
      location: "Main Sanctuary",
      type: "Special",
      description: "Join us for a special Bible Sunday celebration.",
    },
    {
      title: "Audit tuahnak",
      date: "October 25, 2025",
      dateObj: new Date(2025, 9, 25),
      time: "TBA",
      location: "Church Office",
      type: "Study",
      description: "Church audit meeting.",
    },
    {
      title: "CBC Nubu Sunday",
      date: "October 26, 2025",
      dateObj: new Date(2025, 9, 26),
      time: "TBA",
      location: "Main Sanctuary",
      type: "Special",
      description: "CBC Nubu Sunday celebration.",
    },
    {
      title: "EC Regular Meeting",
      date: "November 01, 2025",
      dateObj: new Date(2025, 10, 1),
      time: "TBA",
      location: "Conference Room",
      type: "Study",
      description: "Executive Committee regular meeting.",
    },
    {
      title: "CBCUSA Men's Conference",
      date: "November 06-09, 2025",
      dateObj: new Date(2025, 10, 6),
      time: "All Day",
      location: "Conference Center",
      type: "Special",
      description: "CBCUSA Men's Conference - Four days of fellowship, worship, and spiritual growth.",
    },
    {
      title: "Church Council Meeting",
      date: "November 15, 2025",
      dateObj: new Date(2025, 10, 15),
      time: "TBA",
      location: "Conference Room",
      type: "Study",
      description: "Church Council meeting for planning and decision-making.",
    },
    {
      title: "Church School Christmas Hmannak",
      date: "December 06, 2025",
      dateObj: new Date(2025, 11, 6),
      time: "TBA",
      location: "Fellowship Hall",
      type: "Children",
      description: "Church School Christmas celebration and preparation.",
    },
    {
      title: "Mino Sweet December Hmannak",
      date: "December 07, 2025",
      dateObj: new Date(2025, 11, 7),
      time: "TBA",
      location: "Main Sanctuary",
      type: "Special",
      description: "Mino Sweet December celebration.",
    },
    {
      title: "Christmas Day",
      date: "December 25, 2025",
      dateObj: new Date(2025, 11, 25),
      time: "TBA",
      location: "Main Sanctuary",
      type: "Special",
      description: "Celebrate the birth of Jesus Christ.",
    },
    {
      title: "Rianṭuantu thimnak",
      date: "December 28, 2025",
      dateObj: new Date(2025, 11, 28),
      time: "TBA",
      location: "Main Sanctuary",
      type: "Worship",
      description: "Rianṭuantu thimnak service.",
    },
    {
      title: "Kumthar Hngahnak",
      date: "December 31, 2025",
      dateObj: new Date(2025, 11, 31),
      time: "TBA",
      location: "Main Sanctuary",
      type: "Special",
      description: "New Year's Eve celebration and service.",
    },
  ];

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
                          textDecoration: 'underline'
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
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-bold">
                    {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : 'All Events'}
                  </h2>
                  <p className="text-muted-foreground">
                    {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                {selectedDate && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDate(undefined)}
                    className="transition-all hover:scale-105"
                  >
                    Clear Filter
                  </Button>
                )}
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

                        <Button className="w-full transition-all hover:scale-105">
                          Learn More
                        </Button>
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
    </div>
  );
};

export default Events;
