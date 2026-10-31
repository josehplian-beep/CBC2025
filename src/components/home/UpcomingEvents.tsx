import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { format, differenceInCalendarDays } from "date-fns";
import { ArrowRight, ArrowUpRight, Clock, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { eventPath, eventStart, formatEventRange } from "@/lib/event-dates";

export interface HomeEvent {
  id: string;
  slug?: string | null;
  title: string;
  description: string | null;
  date_obj: string;
  end_date?: string | null;
  time: string;
  location: string;
  type: string;
  image_url?: string | null;
}

function parseStartTime(event: HomeEvent): Date {
  const day = eventStart(event);
  const match = event.time?.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (match) {
    let h = Number(match[1]) % 12;
    if (match[3].toUpperCase() === "PM") h += 12;
    day.setHours(h, Number(match[2] || 0));
  }
  return day;
}

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!target) return null;
  const diff = Math.max(0, target.getTime() - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    minutes: Math.floor(diff / 60000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
    started: diff === 0,
  };
}

function whenLabel(event: HomeEvent) {
  const days = differenceInCalendarDays(eventStart(event), new Date());
  if (days <= 0) return "Happening today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export function FeaturedEvent({ event }: { event: HomeEvent }) {
  const countdown = useCountdown(parseStartTime(event));
  const start = eventStart(event);

  return (
    <section className="relative z-20 -mt-24 px-4 pb-10 bg-foreground dark:bg-background">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="container mx-auto max-w-6xl"
      >
        <Link
          to={eventPath(event)}
          aria-label={`Open ${event.title}`}
          className="group relative grid overflow-hidden rounded-3xl text-primary-foreground shadow-2xl ring-1 ring-primary-foreground/10 md:grid-cols-[1.1fr_1fr]"
          style={{ background: "linear-gradient(135deg, hsl(203.18 32.84% 12%) 0%, hsl(203.18 32.84% 20%) 100%)" }}
        >
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-accent/40 blur-3xl animate-pulse" />
          <div className="pointer-events-none absolute -bottom-24 right-1/3 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-8 p-7 md:p-10">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary-foreground" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-foreground/80">Next up · {whenLabel(event)}</span>
            </div>

            <div className="flex items-start gap-5">
              <div className="flex shrink-0 flex-col items-center rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-3 backdrop-blur-md">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">{format(start, "MMM")}</span>
                <span className="font-display text-4xl font-bold leading-none">{format(start, "d")}</span>
                <span className="mt-1 text-[11px] text-primary-foreground/70">{format(start, "EEE")}</span>
              </div>
              <div>
                <span className="mb-2 inline-block rounded-full bg-primary-foreground/15 px-3 py-0.5 text-xs font-medium">{event.type}</span>
                <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">{event.title}</h2>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-primary-foreground/80">
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{event.time}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.location}</span>
                </div>
              </div>
            </div>

            {countdown && !countdown.started && (
              <div className="grid max-w-sm grid-cols-4 gap-2">
                {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
                  <div key={unit} className="rounded-xl bg-primary-foreground/10 py-2 text-center backdrop-blur-sm">
                    <div className="font-display text-2xl font-bold tabular-nums">{String(countdown[unit]).padStart(2, "0")}</div>
                    <div className="text-[10px] uppercase tracking-wider text-primary-foreground/60">{unit}</div>
                  </div>
                ))}
              </div>
            )}

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-foreground px-5 py-2.5 text-sm font-semibold text-primary transition-all group-hover:gap-3">
              See details <ArrowRight className="h-4 w-4" />
            </span>
          </div>

          <div className="relative min-h-[220px] overflow-hidden">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-primary-foreground/5">
                <Sparkles className="h-24 w-24 text-primary-foreground/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-transparent to-transparent md:from-primary/80" />
          </div>
        </Link>
      </motion.div>
    </section>
  );
}

export function MoreEvents({ events }: { events: HomeEvent[] }) {
  return (
    <section className="relative overflow-hidden bg-background py-24">
      <div className="pointer-events-none absolute right-0 top-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="container relative mx-auto px-4">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-accent">What's coming up</span>
            <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">On the calendar</h2>
            <p className="mt-2 text-muted-foreground">Join us for worship, fellowship, and spiritual growth.</p>
          </div>
          <Link to="/events">
            <Button variant="outline" className="group rounded-full border-primary/30">
              View all events <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {events.map((event, i) => {
            const start = eventStart(event);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link
                  to={eventPath(event)}
                  className="group relative flex h-full flex-col gap-5 rounded-3xl border border-border/60 bg-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col items-center rounded-2xl bg-primary px-3.5 py-2 text-primary-foreground transition-transform group-hover:-rotate-3">
                      <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80">{format(start, "MMM")}</span>
                      <span className="font-display text-2xl font-bold leading-none">{format(start, "d")}</span>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-all group-hover:rotate-45 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent">{event.type} · {whenLabel(event)}</span>
                    <h3 className="mt-1 font-display text-xl font-semibold leading-snug transition-colors group-hover:text-primary">{event.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{formatEventRange(event)}</p>
                  </div>
                  <div className="space-y-1.5 border-t border-border/60 pt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" />{event.time}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" />{event.location}</div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
