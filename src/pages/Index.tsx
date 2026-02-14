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

const CHANNEL_ID = "UCNQNT1hM2b6_jd50ja-XAeQ";
const HERO_VIDEO_ID = "C2iF2xNjtIs";

const eventColors: Record<string, string> = {
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

interface ChurchEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
}

const Index = () => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ChurchEvent[]>([]);

  useEffect(() => {
    loadVideos();
    loadEvents();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const data = await searchYouTubeVideos({ channelId: CHANNEL_ID, maxResults: 8, order: "date" });
      setVideos(data);
    } catch (err) {
      console.error("Failed to load videos:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("events")
      .select("*")
      .or(`date_obj.gte.${today.toISOString()},title.ilike.*Sunday Service*`)
      .order("date_obj", { ascending: true })
      .limit(3);

    setEvents(data || []);
  };

  const processedVideos = videos.map(v => ({
    title: v.title,
    date: new Date(v.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    category: v.title.toLowerCase().includes("sermon") ? "Sermon" as const : "Solo" as const,
    thumbnail: v.thumbnail,
    videoId: v.id,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="relative w-screen h-screen flex items-center justify-center overflow-hidden" style={{ marginLeft: "calc(-50vw + 50%)", width: "100vw" }}>
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <iframe
            className="absolute top-1/2 left-1/2 pointer-events-none"
            src={`https://www.youtube.com/embed/${HERO_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${HERO_VIDEO_ID}&controls=0&modestbranding=1&playsinline=1&rel=0&vq=hd2160`}
            title="Background Video"
            allow="autoplay; encrypted-media"
            style={{ border: 0, transform: "translate(-50%, -50%)", width: "100vw", height: "56.25vw", minHeight: "100vh", minWidth: "177.78vh" }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/50" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Welcome to CBC!
          </h1>
          <p className="text-xl mb-8 text-white/90 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
            "Bawipa kan cungah aa lawmh ahcun"<br />Num 14:8
          </p>
          <Link to="/media">
            <Button size="lg" className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              Join Us This Sunday
            </Button>
          </Link>
          <SocialIcons />
        </div>
      </section>

      {/* Service Times */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-8 h-8" />
            <h2 className="font-display text-3xl font-bold">Sunday Service</h2>
          </div>
          <p className="text-4xl font-bold mb-2">1:00 PM - 3:00 PM</p>
          <p className="text-primary-foreground/80">Join us every Sunday for worship, fellowship, and spiritual growth</p>
        </div>
      </section>

      {/* Videos */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Latest Videos</h2>
            <p className="text-muted-foreground text-lg">Watch our recent sermons and worship sessions</p>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-12">Loading videos...</p>
          ) : processedVideos.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No videos found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {processedVideos.map((v, i) => <VideoCard key={v.videoId || i} {...v} />)}
            </div>
          )}
        </div>
      </section>

      {/* Events */}
      <section className="py-16 bg-gradient-to-br from-muted/40 via-muted/60 to-muted/40 dark:from-muted/20 dark:via-muted/30 dark:to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-2">Upcoming Events</h2>
            <p className="text-muted-foreground text-sm">Join us for worship, fellowship, and spiritual growth</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <Badge className={eventColors[event.type] || eventColors.Others}>{event.type}</Badge>
                  <CardTitle className="text-lg font-semibold leading-tight mt-2">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm">{event.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /><span>{event.date}</span></div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /><span>{event.time}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /><span>{event.location}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/events"><Button size="lg">View All Events</Button></Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
            {[
              { icon: Users, title: "Connect", desc: "Join our welcoming community and build lasting relationships" },
              { icon: Book, title: "Learn", desc: "Grow in your faith through Bible study and worship" },
              { icon: Heart, title: "Serve", desc: "Make a difference in our community through service" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="space-y-4">
                <div className="bg-primary-foreground/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="font-display text-xl font-bold">{title}</h3>
                <p className="text-primary-foreground/80">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

function SocialIcons() {
  const links = [
    { href: SOCIAL.facebook, icon: Facebook },
    { href: SOCIAL.instagram, icon: Instagram },
    { href: SOCIAL.youtube, icon: Youtube },
  ];

  return (
    <div className="flex justify-center gap-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
      {links.map(({ href, icon: Icon }) => (
        <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm">
          <Icon className="w-5 h-5 text-white" />
        </a>
      ))}
    </div>
  );
}

export default Index;
