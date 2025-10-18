import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

const Events = () => {
  const events = [
    {
      title: "Sunday Worship Service",
      date: "Every Sunday",
      time: "1:00 PM - 3:00 PM",
      location: "Main Sanctuary",
      type: "Worship",
      description: "Join us for worship, prayer, and biblical teaching.",
    },
    {
      title: "Youth Group Meeting",
      date: "Every Friday",
      time: "6:00 PM - 8:00 PM",
      location: "Youth Center",
      type: "Youth",
      description: "Fun, fellowship, and faith-building activities for teens.",
    },
    {
      title: "Women's Bible Study",
      date: "Every Wednesday",
      time: "10:00 AM - 12:00 PM",
      location: "Fellowship Hall",
      type: "Study",
      description: "Deep dive into God's Word with fellow sisters in Christ.",
    },
    {
      title: "Community Outreach",
      date: "February 15, 2025",
      time: "9:00 AM - 2:00 PM",
      location: "Downtown",
      type: "Outreach",
      description: "Serving our community with food and supplies.",
    },
    {
      title: "Easter Sunday Service",
      date: "April 20, 2025",
      time: "8:00 AM & 10:30 AM",
      location: "Main Sanctuary",
      type: "Special",
      description: "Celebrate the resurrection of Jesus Christ.",
    },
    {
      title: "Summer VBS",
      date: "June 16-20, 2025",
      time: "9:00 AM - 12:00 PM",
      location: "Church Campus",
      type: "Children",
      description: "Vacation Bible School for kids ages 5-12.",
    },
  ];

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
      <section className="relative h-[300px] flex items-center justify-center overflow-hidden mt-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="relative z-10 text-center text-primary-foreground px-4">
          <Calendar className="w-16 h-16 mx-auto mb-4" />
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">Church Calendar</h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90">
            Stay Connected with Upcoming Events
          </p>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
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
                      <Calendar className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
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

                  <Button className="w-full">
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
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
          <Button size="lg">
            Subscribe to Newsletter
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Events;
