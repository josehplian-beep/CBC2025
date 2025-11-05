import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import VideoCard from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Heart, Book, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import { SOCIAL } from "@/config/social";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { searchYouTubeVideos, type YouTubeVideo } from "@/lib/youtube";
import heroModernChurch from "@/assets/hero-CBC-Church.jpg";

const Index = () => {
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchVideos();
    fetchEvents();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    const videos = await searchYouTubeVideos({
      channelId: "UCNQNT1hM2b6_jd50ja-XAeQ",
      maxResults: 8,
      order: "date",
    });
    setYoutubeVideos(videos);
    setLoading(false);
  };

  const fetchEvents = async () => {
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0); // Start of today in UTC

    const orFilter = `date_obj.gte.${todayUtc.toISOString()},title.ilike.*Sunday Service*`;

    const { data, error } = await supabase
      .from('events' as any)
      .select('*')
      .or(orFilter)
      .order('date_obj', { ascending: true })
      .limit(3);
    
    if (!error && data) {
      setUpcomingEvents(data);
    }
  };

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
    Others: "bg-muted text-muted-foreground",
  };
  const processedVideos = youtubeVideos.map((video) => {
    const date = new Date(video.publishedAt);
    return {
      title: video.title,
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      category: video.title.toLowerCase().includes("sermon") ? "Sermon" : ("Solo" as "Sermon" | "Solo"),
      thumbnail: video.thumbnail,
      videoId: video.id,
    };
  });
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroModernChurch})`,
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Welcome to CBC!
          </h1>
          <p className="text-xl mb-8 text-white/90 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 md:text-xl text-center">
            "Bawipa kan cungah aa lawmh ahcun" 14:8
          </p>
          <Button size="lg" className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            Join Us This Sunday
          </Button>
          
          {/* Social Media Icons */}
          <div className="flex justify-center gap-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            <a
              href={SOCIAL.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <Facebook className="w-5 h-5 text-white" />
            </a>
            <a
              href={SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <Instagram className="w-5 h-5 text-white" />
            </a>
            <a
              href={SOCIAL.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              <Youtube className="w-5 h-5 text-white" />
            </a>
          </div>
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
            <p className="text-muted-foreground text-lg">Watch our recent sermons and worship sessions</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading videos...</p>
            </div>
          ) : processedVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {processedVideos.map((video, index) => (
                <VideoCard key={index} {...video} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No videos found</p>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-16 bg-gradient-to-br from-muted/40 via-muted/60 to-muted/40 dark:from-muted/20 dark:via-muted/30 dark:to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-2">Upcoming Events</h2>
            <p className="text-muted-foreground text-sm">Join us for worship, fellowship, and spiritual growth</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={typeColors[event.type]}>{event.type}</Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold leading-tight">{event.title}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm leading-relaxed">{event.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{event.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{event.time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/events">
              <Button size="lg">View All Events</Button>
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
                <p className="text-primary-foreground/80">Grow in your faith through Bible study and worship</p>
              </div>
              <div className="space-y-4">
                <div className="bg-primary-foreground/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="font-display text-xl font-bold">Serve</h3>
                <p className="text-primary-foreground/80">Make a difference in our community through service</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
export default Index;
