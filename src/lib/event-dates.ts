import { format } from "date-fns";

export interface EventDates {
  date_obj: string;
  end_date?: string | null;
}

export const eventPath = (e: { slug?: string | null; id?: string }) =>
  e?.slug ? `/e/${e.slug}` : `/events/${e?.id}`;

// "YYYY-MM-DD..." -> local midnight, so a calendar day never shifts with the timezone.
export function parseDay(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toDayString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export const eventStart = (e: EventDates) => parseDay(e.date_obj);

export function eventEnd(e: EventDates): Date {
  const start = eventStart(e);
  if (!e.end_date) return start;
  const end = parseDay(e.end_date);
  return end < start ? start : end;
}

export const isMultiDay = (e: EventDates) => eventEnd(e).getTime() !== eventStart(e).getTime();

export function occursOn(e: EventDates, day: Date): boolean {
  const d = startOfLocalDay(day);
  return d >= eventStart(e) && d <= eventEnd(e);
}

export function overlapsRange(e: EventDates, from: Date, to: Date): boolean {
  return eventStart(e) <= startOfLocalDay(to) && eventEnd(e) >= startOfLocalDay(from);
}

// An event stays "upcoming" until its last day has passed.
export const isUpcoming = (e: EventDates, today = new Date()) => eventEnd(e) >= startOfLocalDay(today);

export const isOngoing = (e: EventDates, today = new Date()) =>
  isMultiDay(e) && occursOn(e, today);

export function eventDays(e: EventDates, limit = 62): Date[] {
  const days: Date[] = [];
  const end = eventEnd(e);
  for (let d = eventStart(e); d <= end && days.length < limit; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    days.push(d);
  }
  return days;
}

export function formatEventRange(e: EventDates): string {
  const start = eventStart(e);
  const end = eventEnd(e);
  if (!isMultiDay(e)) return format(start, "MMMM d, yyyy");
  if (start.getFullYear() !== end.getFullYear()) return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
  if (start.getMonth() !== end.getMonth()) return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  return `${format(start, "MMMM d")} – ${format(end, "d, yyyy")}`;
}

export function formatEventTime(e: { time?: string | null; end_time?: string | null }): string {
  if (e.end_time && e.time) return `${e.time} – ${e.end_time}`;
  return e.time || e.end_time || "";
}
