import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import VideoCard from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Heart, Book, MapPin, Facebook, Instagram, Youtube, ChevronDown, ArrowRight } from "lucide-react";
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

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const Index = () => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

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

      <HeroSection heroOpacity={heroOpacity} />
      <ServiceTimesSection />
      <VideosSection loading={loading} videos={processedVideos} />
      <EventsSection events={events} />
      <CTASection />
      <Footer />
    </div>
  );
};

function HeroSection({ heroOpacity }: { heroOpacity: ReturnType<typeof useTransform> }) {
  return (
    <section className="relative w-screen h-[70vh] flex items-center justify-center overflow-hidden" style={{ marginLeft: "calc(-50vw + 50%)", width: "100vw" }}>
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <iframe
          className="absolute top-1/2 left-1/2 pointer-events-none"
          src={`https://www.youtube.com/embed/${HERO_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${HERO_VIDEO_ID}&controls=0&modestbranding=1&playsinline=1&rel=0&vq=hd2160`}
          title="Background Video"
          allow="autoplay; encrypted-media"
          style={{ border: 0, transform: "translate(-50%, -50%)", width: "100vw", height: "56.25vw", minHeight: "100vh", minWidth: "177.78vh" }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/70" />

      <motion.div
        style={{ opacity: heroOpacity }}
        className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto"
      >
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-5xl md:text-7xl font-bold mb-6"
        >
          Welcome to CBC!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl mb-8 text-white/90"
        >
          "Mit hmuh in si loin zumhnak tu in kan kal"<br />2 Korin 5:7
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/media">
            <Button size="lg" className="group">
              Join Us This Sunday
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
        <SocialIcons />
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <ChevronDown className="w-6 h-6 text-white/60" />
      </motion.div>
    </section>
  );
}

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const getNextSunday1PM = () => {
      const now = new Date();
      const next = new Date(now);
      const dayOfWeek = now.getDay();
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      next.setDate(now.getDate() + daysUntilSunday);
      next.setHours(13, 0, 0, 0); // 1:00 PM
      if (next <= now) {
        next.setDate(next.getDate() + 7);
      }
      return next;
    };

    const update = () => {
      const diff = getNextSunday1PM().getTime() - Date.now();
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

function useIsSundayLive() {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      // Sunday = 0, service window 12:30 PM – 3:30 PM (generous buffer)
      setIsLive(now.getDay() === 0 && now.getHours() >= 12 && now.getHours() < 16);
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  return isLive;
}

function ServiceTimesSection() {
  const { days, hours, minutes, seconds } = useCountdown();
  const isLive = useIsSundayLive();

  const units = [
    { label: "Days", value: days },
    { label: "Hours", value: hours },
    { label: "Min", value: minutes },
    { label: "Sec", value: seconds },
  ];

  return (
    <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary-foreground/5 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-primary-foreground/5 blur-3xl" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={staggerContainer}
        className="container mx-auto px-4 text-center relative z-10"
      >
        {isLive ? (
          <>
            <motion.div variants={fadeUp} custom={0} className="flex items-center justify-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-1.5 rounded-full text-sm font-semibold">
                <span className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
                LIVE NOW
              </div>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-3xl font-bold mb-6">
              Sunday Worship Service
            </motion.h2>
            <motion.div variants={fadeUp} custom={2} className="max-w-3xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-primary-foreground/10">
                <div className="aspect-video">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/live_stream?channel=UCNQNT1hM2b6_jd50ja-XAeQ&autoplay=1&mute=1"
                    title="CBC Live Stream"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} custom={3} className="mt-6">
              <Link to="/media?tab=livestream">
                <Button size="lg" variant="secondary" className="group">
                  Watch Live
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </>
        ) : (
          <>
            <motion.div variants={fadeUp} custom={0} className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-primary-foreground/10 p-3 rounded-full">
                <Clock className="w-7 h-7" />
              </div>
              <h2 className="font-display text-3xl font-bold">Sunday Service</h2>
            </motion.div>
            <motion.p variants={fadeUp} custom={1} className="text-5xl font-bold mb-3 tracking-tight">
              1:00 PM — 3:00 PM
            </motion.p>
            <motion.p variants={fadeUp} custom={2} className="text-primary-foreground/70 text-lg max-w-md mx-auto mb-8">
              Join us every Sunday for worship, fellowship, and spiritual growth
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-3 sm:gap-5">
              {units.map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center">
                  <div className="bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10 rounded-xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl font-bold tabular-nums">
                      {String(value).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-primary-foreground/60 mt-1.5">{label}</span>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </motion.div>
    </section>
  );
}

function VideosSection({ loading, videos }: { loading: boolean; videos: any[] }) {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="text-center mb-14"
        >
          <motion.span variants={fadeUp} custom={0} className="text-sm font-semibold text-accent uppercase tracking-widest">
            Watch & Listen
          </motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="font-display text-4xl font-bold mt-2 mb-4">
            Latest Videos
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg max-w-lg mx-auto">
            Watch our recent sermons and worship sessions
          </motion.p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-lg mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No videos found</p>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {videos.map((v, i) => (
              <motion.div key={v.videoId || i} variants={fadeUp} custom={i}>
                <VideoCard {...v} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

function EventsSection({ events }: { events: ChurchEvent[] }) {
  return (
    <section className="py-24 bg-muted/30 dark:bg-muted/10 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="text-center mb-14"
        >
          <motion.span variants={fadeUp} custom={0} className="text-sm font-semibold text-accent uppercase tracking-widest">
            What's Coming Up
          </motion.span>
          <motion.h2 variants={fadeUp} custom={1} className="font-display text-4xl font-bold mt-2 mb-4">
            Upcoming Events
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-sm max-w-md mx-auto">
            Join us for worship, fellowship, and spiritual growth
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {events.map((event, i) => (
            <motion.div key={event.id} variants={fadeUp} custom={i}>
              <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <Badge className={`w-fit ${eventColors[event.type] || eventColors.Others}`}>{event.type}</Badge>
                  <CardTitle className="text-lg font-semibold leading-tight mt-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm line-clamp-2">{event.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-accent" /><span>{event.date}</span></div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-accent" /><span>{event.time}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /><span>{event.location}</span></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-14"
        >
          <Link to="/events">
            <Button size="lg" variant="outline" className="group border-primary/30 hover:border-primary">
              View All Events
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

const ctaItems = [
  { icon: Users, title: "Connect", desc: "Join our welcoming community and build lasting relationships" },
  { icon: Book, title: "Learn", desc: "Grow in your faith through Bible study and worship" },
  { icon: Heart, title: "Serve", desc: "Make a difference in our community through service" },
];

function CTASection() {
  return (
    <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(210_55%_35%)_0%,_transparent_60%)] opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(210_50%_30%)_0%,_transparent_60%)] opacity-30" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={staggerContainer}
        className="container mx-auto px-4 relative z-10"
      >
        <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
          <span className="text-sm font-semibold text-primary-foreground/60 uppercase tracking-widest">Get Started</span>
          <h2 className="font-display text-4xl font-bold mt-2">Be Part of Something Greater</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
          {ctaItems.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              variants={fadeUp}
              custom={i + 1}
              whileHover={{ y: -6, scale: 1.02 }}
              className="text-center group"
            >
              <div className="bg-primary-foreground/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-primary-foreground/20 transition-colors duration-300">
                <Icon className="w-9 h-9" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
              <p className="text-primary-foreground/70 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function SocialIcons() {
  const links = [
    { href: SOCIAL.facebook, icon: Facebook },
    { href: SOCIAL.instagram, icon: Instagram },
    { href: SOCIAL.youtube, icon: Youtube },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="flex justify-center gap-4 mt-6"
    >
      {links.map(({ href, icon: Icon }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/25 hover:scale-110 transition-all duration-300 backdrop-blur-sm"
        >
          <Icon className="w-5 h-5 text-white" />
        </a>
      ))}
    </motion.div>
  );
}

export default Index;
