import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { format, differenceInCalendarDays } from "date-fns";
import {
  Calendar as CalendarIcon, Clock, MapPin, ArrowLeft, Share2,
  Facebook, Twitter, Instagram, Link2, Check, Sparkles, Users, ArrowRight,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const eventPath = (e: any) => (e?.slug ? `/e/${e.slug}` : `/events/${e?.id}`);

const EventDetail = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id && !slug) return;
      setLoading(true);
      const query = supabase.from("events" as any).select("*");
      const { data, error } = slug
        ? await query.eq("slug", slug).maybeSingle()
        : await query.eq("id", id!).maybeSingle();
      if (error || !data) {
        setEvent(null);
      } else {
        const e: any = data;
        const [y, m, d] = e.date_obj.split("T")[0].split("-").map(Number);
        e.dateObj = new Date(y, m - 1, d);
        setEvent(e);

        const { data: others } = await supabase
          .from("events" as any)
          .select("*")
          .neq("id", e.id)
          .gte("date_obj", new Date().toISOString().split("T")[0])
          .order("date_obj", { ascending: true })
          .limit(3);
        setRelated((others as any[]) || []);
      }
      setLoading(false);
    };
    load();
  }, [id, slug]);

  const countdown = useMemo(() => {
    if (!event?.dateObj) return null;
    const days = differenceInCalendarDays(event.dateObj, new Date());
    if (days > 1) return `${days} days to go`;
    if (days === 1) return "Tomorrow";
    if (days === 0) return "Happening today";
    return "This event has passed";
  }, [event]);

  const shortPath = event ? eventPath(event) : `/events/${id}`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${shortPath}` : "";
  const shareTitle = event ? `${event.title} — Chin Bethel Church` : "Event";
  const shareText = event ? `${event.title} • ${event.date} at ${event.time} • ${event.location}` : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 1800);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch {}
    } else {
      copyLink();
    }
  };

  const shareFacebook = () =>
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, "_blank");
  const shareTwitter = () =>
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  const shareInstagram = () => {
    copyLink();
    toast.info("Instagram does not support direct link sharing — link copied so you can paste it.");
  };

  const downloadIcs = () => {
    if (!event) return;
    const startDate = format(event.dateObj, "yyyyMMdd");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Chin Bethel Church//Events//EN",
      "BEGIN:VEVENT", `UID:${event.id}@chinbethelchurch.com`,
      `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
      `DTSTART:${startDate}`, `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ""}`, `LOCATION:${event.location}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/\s+/g, "-")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-32 space-y-4 max-w-3xl">
          <div className="h-8 w-2/3 rounded-lg bg-muted animate-pulse" />
          <div className="h-56 rounded-2xl bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-2xl font-display font-bold mb-2">Event not found</h1>
          <p className="text-muted-foreground mb-6">This event may have been removed.</p>
          <Button onClick={() => navigate("/events")}><ArrowLeft className="w-4 h-4 mr-2" />Back to Events</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const description = event.description?.slice(0, 160) || `${event.title} on ${event.date} at ${event.time}, ${event.location}.`;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.dateObj.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: event.location },
    description: event.description || description,
    image: event.image_url || undefined,
    organizer: { "@type": "Organization", name: "Chin Bethel Church", url: "https://chinbethelchurch.com" },
    url: shareUrl,
  });

  const facts = [
    { icon: CalendarIcon, label: "Date", value: format(event.dateObj, "EEEE, MMMM d, yyyy") },
    { icon: Clock, label: "Time", value: event.time },
    { icon: MapPin, label: "Location", value: event.location },
    { icon: Users, label: "Who's invited", value: `${event.type} • Everyone welcome` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${event.title} | Chin Bethel Church`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={shareUrl} />
        <meta property="og:type" content="event" />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={shareUrl} />
        {event.image_url && <meta property="og:image" content={event.image_url} />}
        <meta name="twitter:card" content={event.image_url ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={description} />
        {event.image_url && <meta name="twitter:image" content={event.image_url} />}
        <script type="application/ld+json">{jsonLd}</script>
      </Helmet>

      <Navigation />

      {/* Immersive hero */}
      <section className="relative mt-20 overflow-hidden">
        {event.image_url && (
          <div className="absolute inset-0">
            <img src={event.image_url} alt="" aria-hidden className="w-full h-full object-cover scale-105 blur-xl opacity-40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" style={{ mixBlendMode: "multiply" }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--accent)/0.25),transparent_60%)]" />

        <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
          <Link to="/events" className="inline-flex items-center gap-1.5 text-primary-foreground/80 hover:text-primary-foreground text-sm mb-5">
            <ArrowLeft className="w-4 h-4" /> All Events
          </Link>

          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
            <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className={typeColors[event.type] || "bg-secondary"}>{event.type}</Badge>
                {countdown && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur">
                    <Sparkles className="w-3.5 h-3.5" /> {countdown}
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-primary-foreground">{event.title}</h1>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-primary-foreground/85 text-sm">
                <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4" />{event.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{event.time}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{event.location}</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={downloadIcs} variant="secondary" className="rounded-full">
                  <CalendarIcon className="w-4 h-4 mr-2" /> Add to Calendar
                </Button>
                <Button onClick={nativeShare} variant="outline" className="rounded-full bg-primary-foreground/10 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/20">
                  <Share2 className="w-4 h-4 mr-2" /> Invite a Friend
                </Button>
              </div>
            </motion.div>

            {event.image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="hidden lg:block"
              >
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full max-h-[380px] object-contain rounded-2xl shadow-2xl ring-1 ring-primary-foreground/20 bg-background/10"
                  loading="lazy"
                />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Quick facts */}
      <section className="container mx-auto px-4 -mt-6 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {facts.map((f, i) => (
            <motion.div key={f.label} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <Card className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
                    <f.icon className="w-3.5 h-3.5" /> {f.label}
                  </div>
                  <p className="mt-1.5 text-sm font-medium leading-snug">{f.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <div>
            {event.image_url && (
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-auto rounded-2xl mb-6 object-contain bg-muted/30 lg:hidden"
                loading="lazy"
              />
            )}
            <h2 className="font-display text-xl font-bold mb-3">About this event</h2>
            {event.description ? (
              <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap text-foreground/90 leading-relaxed">
                {event.description}
              </div>
            ) : (
              <p className="text-muted-foreground">More details coming soon — check back or reach out to the church office.</p>
            )}

            {related.length > 0 && (
              <div className="mt-12">
                <h2 className="font-display text-xl font-bold mb-4">More upcoming events</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {related.map((r) => (
                    <Link key={r.id} to={eventPath(r)} className="group">
                      <Card className="rounded-2xl border border-border/60 h-full overflow-hidden transition-shadow hover:shadow-lg">
                        {r.image_url && (
                          <div className="h-28 bg-muted/40 overflow-hidden">
                            <img src={r.image_url} alt={r.title} loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <p className="text-[11px] text-muted-foreground">{r.date}</p>
                          <p className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">{r.title}</p>
                          <span className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
                            View <ArrowRight className="w-3 h-3" />
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <Card className="rounded-2xl border border-border/60">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-display font-bold text-base">Share this event</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={nativeShare}>
                    <Share2 className="w-4 h-4 mr-1" /> Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyLink}>
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Link2 className="w-4 h-4 mr-1" />}
                    {copied ? "Copied" : "Copy link"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={shareFacebook}>
                    <Facebook className="w-4 h-4 mr-1" /> Facebook
                  </Button>
                  <Button variant="outline" size="sm" onClick={shareTwitter}>
                    <Twitter className="w-4 h-4 mr-1" /> Twitter
                  </Button>
                  <Button variant="outline" size="sm" onClick={shareInstagram}>
                    <Instagram className="w-4 h-4 mr-1" /> Instagram
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadIcs}>
                    <CalendarIcon className="w-4 h-4 mr-1" /> Calendar
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground break-all border-t border-border/50 pt-3">{shareUrl}</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EventDetail;
