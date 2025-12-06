/**
 * Index.tsx - Homepage Component
 * 
 * The main landing page for Chin Bethel Church website.
 * Displays hero section, service times, latest videos, upcoming events,
 * and call-to-action sections.
 */

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

// ============================================================================
// Constants & Configuration
// ============================================================================

/** YouTube channel ID for fetching latest videos */
const YOUTUBE_CHANNEL_ID = "UCNQNT1hM2b6_jd50ja-XAeQ";

/** Maximum number of videos to display on the homepage */
const MAX_VIDEOS_TO_DISPLAY = 8;

/** Maximum number of upcoming events to show */
const MAX_EVENTS_TO_DISPLAY = 3;

/** Hero section background video ID */
const HERO_VIDEO_ID = "C2iF2xNjtIs";

/** Color mapping for different event types */
const EVENT_TYPE_COLORS: Record<string, string> = {
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

// ============================================================================
// Types & Interfaces
// ============================================================================

interface ProcessedVideo {
  title: string;
  date: string;
  category: "Sermon" | "Solo";
  thumbnail: string;
  videoId: string;
}

interface ChurchEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transforms raw YouTube video data into a format suitable for VideoCard component
 */
function processVideoData(videos: YouTubeVideo[]): ProcessedVideo[] {
  return videos.map((video) => {
    const publishDate = new Date(video.publishedAt);
    const isSermon = video.title.toLowerCase().includes("sermon");
    
    return {
      title: video.title,
      date: publishDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      category: isSermon ? "Sermon" : "Solo",
      thumbnail: video.thumbnail,
      videoId: video.id,
    };
  });
}

// ============================================================================
// Main Component
// ============================================================================

const Index = () => {
  // State for YouTube videos
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  
  // State for upcoming events
  const [upcomingEvents, setUpcomingEvents] = useState<ChurchEvent[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchLatestVideos();
    fetchUpcomingEvents();
  }, []);

  /**
   * Fetches the latest videos from the church's YouTube channel
   */
  const fetchLatestVideos = async () => {
    setIsLoadingVideos(true);
    
    try {
      const videos = await searchYouTubeVideos({
        channelId: YOUTUBE_CHANNEL_ID,
        maxResults: MAX_VIDEOS_TO_DISPLAY,
        order: "date",
      });
      setYoutubeVideos(videos);
    } catch (error) {
      console.error("Failed to fetch YouTube videos:", error);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  /**
   * Fetches upcoming events from the database
   * Includes events from today onwards, plus recurring Sunday Services
   */
  const fetchUpcomingEvents = async () => {
    try {
      // Get start of today in UTC for date comparison
      const todayUtc = new Date();
      todayUtc.setUTCHours(0, 0, 0, 0);

      // Query for upcoming events or Sunday Services
      const eventFilter = `date_obj.gte.${todayUtc.toISOString()},title.ilike.*Sunday Service*`;
      
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .or(eventFilter)
        .order("date_obj", { ascending: true })
        .limit(MAX_EVENTS_TO_DISPLAY);

      if (error) {
        console.error("Failed to fetch events:", error);
        return;
      }

      setUpcomingEvents(data || []);
    } catch (error) {
      console.error("Failed to fetch upcoming events:", error);
    }
  };

  // Process videos for display
  const displayVideos = processVideoData(youtubeVideos);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* ================================================================
          Hero Section - Full-screen video background with welcome message
          ================================================================ */}
      <section 
        className="relative w-screen h-screen flex items-center justify-center overflow-hidden" 
        style={{ 
          marginLeft: 'calc(-50vw + 50%)', 
          marginRight: 'calc(-50vw + 50%)', 
          width: '100vw', 
          maxWidth: '100vw' 
        }}
      >
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <iframe
            className="absolute top-1/2 left-1/2 pointer-events-none"
            src={`https://www.youtube.com/embed/${HERO_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${HERO_VIDEO_ID}&controls=0&modestbranding=1&playsinline=1&rel=0&vq=hd2160&hd=1`}
            title="Church Background Video"
            allow="autoplay; encrypted-media"
            style={{
              border: 0,
              transform: "translate(-50%, -50%)",
              width: "100vw",
              height: "56.25vw",
              minHeight: "100vh",
              minWidth: "177.78vh",
            }}
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/70" />

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Welcome to CBC!
          </h1>
          
          {/* Scripture Quote - Chin Language */}
          <p className="text-xl mb-8 text-white/90 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 md:text-xl text-center">
            "Bawipa kan cungah aa lawmh ahcun"
            <br />
            Num 14:8
          </p>
          
          <Link to="/media">
            <Button 
              size="lg" 
              className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300"
            >
              Join Us This Sunday
            </Button>
          </Link>

          {/* Social Media Links */}
          <SocialMediaIcons />
        </div>
      </section>

      {/* ================================================================
          Service Times Section
          ================================================================ */}
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

      {/* ================================================================
          Latest Videos Section
          ================================================================ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Latest Videos</h2>
            <p className="text-muted-foreground text-lg">
              Watch our recent sermons and worship sessions
            </p>
          </div>

          <VideoGrid videos={displayVideos} isLoading={isLoadingVideos} />
        </div>
      </section>

      {/* ================================================================
          Upcoming Events Section
          ================================================================ */}
      <section className="py-16 bg-gradient-to-br from-muted/40 via-muted/60 to-muted/40 dark:from-muted/20 dark:via-muted/30 dark:to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-2">Upcoming Events</h2>
            <p className="text-muted-foreground text-sm">
              Join us for worship, fellowship, and spiritual growth
            </p>
          </div>

          <EventsGrid events={upcomingEvents} />

          <div className="text-center mt-12">
            <Link to="/events">
              <Button size="lg">View All Events</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          Call to Action Section - Connect, Learn, Serve
          ================================================================ */}
      <CallToActionSection />

      <Footer />
    </div>
  );
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Social media icon links displayed in the hero section
 */
function SocialMediaIcons() {
  const socialLinks = [
    { href: SOCIAL.facebook, icon: Facebook, label: "Facebook" },
    { href: SOCIAL.instagram, icon: Instagram, label: "Instagram" },
    { href: SOCIAL.youtube, icon: Youtube, label: "YouTube" },
  ];

  return (
    <div className="flex justify-center gap-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
      {socialLinks.map(({ href, icon: Icon, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm"
        >
          <Icon className="w-5 h-5 text-white" />
        </a>
      ))}
    </div>
  );
}

/**
 * Grid of video cards with loading state
 */
function VideoGrid({ videos, isLoading }: { videos: ProcessedVideo[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading videos...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No videos found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {videos.map((video, index) => (
        <VideoCard key={video.videoId || index} {...video} />
      ))}
    </div>
  );
}

/**
 * Grid of event cards
 */
function EventsGrid({ events }: { events: ChurchEvent[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <Card key={event.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <Badge className={EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS.Others}>
                {event.type}
              </Badge>
            </div>
            <CardTitle className="text-lg font-semibold leading-tight">
              {event.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {event.description}
            </p>

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
  );
}

/**
 * Call-to-action section with Connect, Learn, Serve pillars
 */
function CallToActionSection() {
  const pillars = [
    {
      icon: Users,
      title: "Connect",
      description: "Join our welcoming community and build lasting relationships",
    },
    {
      icon: Book,
      title: "Learn",
      description: "Grow in your faith through Bible study and worship",
    },
    {
      icon: Heart,
      title: "Serve",
      description: "Make a difference in our community through service",
    },
  ];

  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {pillars.map(({ icon: Icon, title, description }) => (
              <div key={title} className="space-y-4">
                <div className="bg-primary-foreground/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="font-display text-xl font-bold">{title}</h3>
                <p className="text-primary-foreground/80">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Index;
