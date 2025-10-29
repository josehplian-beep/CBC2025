import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import VideoCard from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Heart, Book, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { searchYouTubeVideos, type YouTubeVideo } from "@/lib/youtube";
import heroModernBuilding from "@/assets/hero-modern-building.jpg";

const Index = () => {
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    // Fetch videos from Chin Bethel Church DC channel
    const videos = await searchYouTubeVideos({
      channelId: "UCNQNT1hM2b6_jd50ja-XAeQ",
      maxResults: 8,
      order: 'date'
    });
    setYoutubeVideos(videos);
    setLoading(false);
  };

  const upcomingEvents = [
    {
      title: "Sunday Worship Service",
      date: "Every Sunday",
      time: "1:00 PM - 3:00 PM",
      location: "Main Sanctuary",
      type: "Worship",
      description: "Join us for worship, prayer, and biblical teaching.",
    },
    {
      title: "Bible Sunday",
      date: "October 19, 2025",
      time: "TBA",
      location: "Main Sanctuary",
      type: "Special",
      description: "Join us for a special Bible Sunday celebration.",
    },
    {
      title: "CBC Nubu Sunday",
      date: "October 26, 2025",
      time: "TBA",
      location: "Main Sanctuary",
      type: "Special",
      description: "CBC Nubu Sunday celebration.",
    },
    {
      title: "CBCUSA Men's Conference",
      date: "November 06-09, 2025",
      time: "All Day",
      location: "Conference Center",
      type: "Special",
      description: "CBCUSA Men's Conference - Four days of fellowship, worship, and spiritual growth.",
    },
    {
      title: "Christmas Day",
      date: "December 25, 2025",
      time: "TBA",
      location: "Main Sanctuary",
      type: "Special",
      description: "Celebrate the birth of Jesus Christ.",
    },
    {
      title: "Kumthar Hngahnak",
      date: "December 31, 2025",
      time: "TBA",
      location: "Main Sanctuary",
      type: "Special",
      description: "New Year's Eve celebration and service.",
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
  const processedVideos = youtubeVideos.map(video => {
    const date = new Date(video.publishedAt);
    return {
      title: video.title,
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      category: video.title.toLowerCase().includes('sermon') ? 'Sermon' : 'Solo' as "Sermon" | "Solo",
      thumbnail: video.thumbnail,
      videoId: video.id
    };
  });
  return <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
          backgroundImage: `url(${heroModernBuilding})`
        }}>
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Welcome to CBC!
          </h1>
          <p className="text-xl mb-8 text-white/90 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 md:text-xl text-center">"Bawipa kan cungah aa lawmh ahcun"
14:8</p>
          <Button size="lg" className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            Join Us This Sunday
          </Button>
        </div>
      </section>

      {/* Service Times */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Clock className="w-8 h-8" />
              <h2 className="font-display text-3xl font-bold">Sunday Service</h2>
            </div>
            <p className="text-4xl font-bold mb-2">1:00 PM - 3:00 PM</p>
            <p className="text-primary-foreground/80">
              Join us every Sunday for worship, fellowship, and spiritual growth
            </p>
          </div>
        </div>
      </section>

      {/* Latest Videos */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Latest Videos</h2>
            <p className="text-muted-foreground text-lg">
              Watch our recent sermons and worship sessions
            </p>
          </div>

          {loading ? <div className="text-center py-12">
              <p className="text-muted-foreground">Loading videos...</p>
            </div> : processedVideos.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {processedVideos.map((video, index) => <VideoCard key={index} {...video} />)}
            </div> : <div className="text-center py-12">
              <p className="text-muted-foreground">No videos found</p>
            </div>}
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-20 bg-gradient-to-br from-muted/40 via-muted/60 to-muted/40 dark:from-muted/20 dark:via-muted/30 dark:to-muted/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Calendar className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Upcoming Events
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join us for worship, fellowship, and spiritual growth throughout the year
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map((event, index) => (
              <div 
                key={index} 
                className="group relative animate-fade-in hover-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Card className="relative h-full border-2 border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden bg-card/80 backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-[100px]" />
                  
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <Badge className={`${typeColors[event.type]} shadow-lg`}>
                        {event.type}
                      </Badge>
                      <div className="flex-1" />
                    </div>
                    <CardTitle className="text-2xl font-display leading-tight group-hover:text-primary transition-colors">
                      {event.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 backdrop-blur-sm">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Date</p>
                          <p className="font-medium text-sm">{event.date}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 backdrop-blur-sm">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Time</p>
                          <p className="font-medium text-sm">{event.time}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 backdrop-blur-sm">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Location</p>
                          <p className="font-medium text-sm">{event.location}</p>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full group/btn relative overflow-hidden">
                      <span className="relative z-10">Learn More</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <Link to="/events">
              <Button size="lg" className="group/btn relative overflow-hidden px-8 py-6 text-lg">
                <span className="relative z-10 flex items-center gap-2">
                  View All Events
                  <Calendar className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-4">
                <div className="bg-primary-foreground/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="font-display text-xl font-bold">Connect</h3>
                <p className="text-primary-foreground/80">
                  Join our welcoming community and build lasting relationships
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-primary-foreground/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Book className="w-8 h-8" />
                </div>
                <h3 className="font-display text-xl font-bold">Learn</h3>
                <p className="text-primary-foreground/80">
                  Grow in your faith through Bible study and worship
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-primary-foreground/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="font-display text-xl font-bold">Serve</h3>
                <p className="text-primary-foreground/80">
                  Make a difference in our community through service
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default Index;