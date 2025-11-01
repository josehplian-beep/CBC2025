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

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    // Fetch videos from Chin Bethel Church DC channel
    const videos = await searchYouTubeVideos({
      channelId: "UCNQNT1hM2b6_jd50ja-XAeQ",
      maxResults: 8,
      order: "date",
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
        </div>
      </section>

      {/* Social Media Icons - visible below hero */}
      <section className="py-6 bg-background">
        <div className="flex justify-center gap-6">
          <a
            href={SOCIAL.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="group p-3 rounded-full bg-white/80 hover:bg-white shadow transition-colors"
          >
            <Facebook className="w-7 h-7 text-[#1877F3] group-hover:text-[#1877F3]" style={{ filter: 'grayscale(1)', transition: 'filter 0.2s' }} />
          </a>
          <a
            href={SOCIAL.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="group p-3 rounded-full bg-white/80 hover:bg-white shadow transition-colors"
          >
            <Instagram className="w-7 h-7 text-[#E4405F] group-hover:text-[#E4405F]" style={{ filter: 'grayscale(1)', transition: 'filter 0.2s' }} />
          </a>
          <a
            href={SOCIAL.youtube}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="group p-3 rounded-full bg-white/80 hover:bg-white shadow transition-colors"
          >
            <Youtube className="w-7 h-7 text-[#FF0000] group-hover:text-[#FF0000]" style={{ filter: 'grayscale(1)', transition: 'filter 0.2s' }} />
          </a>
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
