import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar as DayPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, Plus, Edit, Trash2, MapPin, Clock, Download, Upload, Search, Copy, Eye, X, CalendarRange, Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import * as XLSX from "xlsx";
import { EventDialog } from "@/components/EventDialog";
import {
  eventDays, eventEnd, eventPath, eventStart, formatEventRange, formatEventTime,
  isMultiDay, isOngoing, isUpcoming, occursOn, overlapsRange, toDayString,
} from "@/lib/event-dates";

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  date: string;
  date_obj: string;
  end_date?: string | null;
  time: string;
  end_time?: string | null;
  location: string;
  type: string;
  slug?: string | null;
  image_url?: string | null;
  recurring_pattern?: string | null;
  recurring_end_date?: string | null;
  is_recurring_parent?: boolean | null;
  parent_event_id?: string | null;
}

type DateFilter = "all" | "upcoming" | "past" | "this-month" | "multi-day";

// Turn a spreadsheet date cell (Excel serial number or text) into YYYY-MM-DD.
function cellToDay(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    return parsed ? `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}` : null;
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const d = new Date(text);
  return isNaN(d.getTime()) ? null : toDayString(d);
}

const AdminEvents = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [duplicating, setDuplicating] = useState<EventRow | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventRow | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("upcoming");
  const [pickedDay, setPickedDay] = useState<Date | undefined>();
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("events").select("*").order("date_obj", { ascending: false });
    if (error) toast.error("Failed to load events");
    else setEvents((data ?? []) as EventRow[]);
    setLoading(false);
  };

  const openCreate = () => { setEditing(null); setDuplicating(null); setDialogOpen(true); };
  const openEdit = (e: EventRow) => { setDuplicating(null); setEditing(e); setDialogOpen(true); };
  const openDuplicate = (e: EventRow) => { setEditing(null); setDuplicating(e); setDialogOpen(true); };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    const { error } = await supabase.from("events").delete().eq("id", eventToDelete.id);
    if (error) toast.error(error.message || "Failed to delete event");
    else {
      toast.success("Event deleted");
      setSelectedIds(ids => ids.filter(id => id !== eventToDelete.id));
      fetchEvents();
    }
    setEventToDelete(null);
  };

  const handleBulkDelete = async () => {
    const { error } = await supabase.from("events").delete().in("id", selectedIds);
    if (error) toast.error(error.message || "Failed to delete events");
    else {
      toast.success(`${selectedIds.length} event(s) deleted`);
      setSelectedIds([]);
      fetchEvents();
    }
    setBulkDeleteOpen(false);
  };

  const handleExport = () => {
    const rows = events.map(e => ({
      Title: e.title,
      Description: e.description || "",
      Date: toDayString(eventStart(e)),
      "End Date": isMultiDay(e) ? toDayString(eventEnd(e)) : "",
      Time: e.time,
      "End Time": e.end_time || "",
      Location: e.location,
      Type: e.type,
      "Image URL": e.image_url || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 30 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Events");
    XLSX.writeFile(wb, `CBC_Events_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Events exported");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const workbook = XLSX.read(new Uint8Array(ev.target?.result as ArrayBuffer), { type: "array" });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[];
        if (rows.length === 0) return toast.error("No data found in the file");
        const missing = ["Title", "Date", "Time", "Location", "Type"].filter(f => !(f in rows[0]));
        if (missing.length) return toast.error(`Missing required columns: ${missing.join(", ")}`);

        const toInsert = rows.flatMap((row) => {
          const start = cellToDay(row["Date"]);
          if (!start) return [];
          const endRaw = cellToDay(row["End Date"]);
          const end = endRaw && endRaw > start ? endRaw : null;
          const [y, m, d] = start.split("-").map(Number);
          return [{
            title: row["Title"],
            description: row["Description"] || null,
            date: formatEventRange({ date_obj: start, end_date: end }),
            date_obj: new Date(y, m - 1, d, 12).toISOString(),
            end_date: end,
            time: String(row["Time"]),
            end_time: row["End Time"] ? String(row["End Time"]) : null,
            location: row["Location"],
            type: row["Type"],
            image_url: row["Image URL"] || null,
          }];
        });
        if (toInsert.length === 0) return toast.error("No rows had a valid date");
        const { error } = await supabase.from("events").insert(toInsert);
        if (error) throw error;
        toast.success(`Imported ${toInsert.length} event(s)`);
        fetchEvents();
      } catch (err: any) {
        toast.error(err.message || "Failed to import events");
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const today = new Date();

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    return events
      .filter(e => {
        if (typeFilter !== "all" && e.type !== typeFilter) return false;
        if (q && ![e.title, e.description, e.location].some(v => v?.toLowerCase().includes(q))) return false;
        if (pickedDay) return occursOn(e, pickedDay);
        switch (dateFilter) {
          case "upcoming": return isUpcoming(e, today);
          case "past": return !isUpcoming(e, today);
          case "this-month": return overlapsRange(e, monthStart, monthEnd);
          case "multi-day": return isMultiDay(e);
          default: return true;
        }
      })
      .sort((a, b) => {
        const aUp = isUpcoming(a, today);
        const bUp = isUpcoming(b, today);
        if (aUp !== bUp) return aUp ? -1 : 1;
        // Upcoming: soonest first. Past: most recent first.
        return aUp
          ? eventStart(a).getTime() - eventStart(b).getTime()
          : eventEnd(b).getTime() - eventEnd(a).getTime();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, searchQuery, typeFilter, dateFilter, pickedDay]);

  const stats = useMemo(() => ({
    total: events.length,
    upcoming: events.filter(e => isUpcoming(e, today)).length,
    thisMonth: events.filter(e => overlapsRange(e, startOfMonth(today), endOfMonth(today))).length,
    past: events.filter(e => !isUpcoming(e, today)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [events]);

  const eventTypes = Array.from(new Set(events.map(e => e.type))).sort();
  const calendarDays = useMemo(() => events.flatMap(e => eventDays(e)), [events]);
  const filtersActive = searchQuery !== "" || typeFilter !== "all" || dateFilter !== "upcoming" || !!pickedDay;

  const clearFilters = () => { setSearchQuery(""); setTypeFilter("all"); setDateFilter("upcoming"); setPickedDay(undefined); };

  const toggleSelection = (id: string) =>
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const allSelected = filteredEvents.length > 0 && filteredEvents.every(e => selectedIds.includes(e.id));
  const toggleSelectAll = () => setSelectedIds(allSelected ? [] : filteredEvents.map(e => e.id));

  const statusOf = (e: EventRow) => {
    if (isOngoing(e, today)) return { label: "Happening now", className: "bg-primary text-primary-foreground" };
    if (occursOn(e, today)) return { label: "Today", className: "bg-primary text-primary-foreground" };
    if (isUpcoming(e, today)) return { label: "Upcoming", className: "bg-secondary text-secondary-foreground" };
    return { label: "Past", className: "bg-muted text-muted-foreground" };
  };

  const statCards = [
    { label: "Total", value: stats.total, filter: "all" as DateFilter },
    { label: "Upcoming", value: stats.upcoming, filter: "upcoming" as DateFilter },
    { label: "This month", value: stats.thisMonth, filter: "this-month" as DateFilter },
    { label: "Past", value: stats.past, filter: "past" as DateFilter },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Events</h1>
            <p className="text-muted-foreground">Create, schedule, and manage church events.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport} className="gap-2" disabled={events.length === 0}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" /> Import
            </Button>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Add Event
            </Button>
          </div>
        </div>

        {/* Stats double as quick filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map(card => {
            const active = !pickedDay && dateFilter === card.filter;
            return (
              <button
                key={card.label}
                type="button"
                onClick={() => { setPickedDay(undefined); setDateFilter(card.filter); }}
                aria-pressed={active}
                className={`text-left rounded-xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="rounded-xl">
          <CardContent className="p-4 flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, description, or location…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Search events"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="lg:w-44" aria-label="Event type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {eventTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={(v) => { setPickedDay(undefined); setDateFilter(v as DateFilter); }}>
              <SelectTrigger className="lg:w-44" aria-label="Date range"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="this-month">This month</SelectItem>
                <SelectItem value="past">Past</SelectItem>
                <SelectItem value="multi-day">Multi-day</SelectItem>
                <SelectItem value="all">All dates</SelectItem>
              </SelectContent>
            </Select>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant={pickedDay ? "default" : "outline"} className="gap-2 lg:w-48 justify-start">
                  <Calendar className="h-4 w-4" />
                  {pickedDay ? format(pickedDay, "MMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <DayPicker
                  mode="single"
                  selected={pickedDay}
                  defaultMonth={pickedDay}
                  onSelect={(d) => { setPickedDay(d); setPickerOpen(false); }}
                  modifiers={{ hasEvent: calendarDays }}
                  modifiersClassNames={{ hasEvent: "font-bold underline decoration-primary decoration-2 underline-offset-4" }}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {filtersActive && (
              <Button variant="ghost" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" /> Reset
              </Button>
            )}
          </CardContent>
        </Card>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-3">
            <span className="font-medium">{selectedIds.length} selected</span>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)} className="gap-2">
                <Trash2 className="h-4 w-4" /> Delete selected
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>Clear</Button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="rounded-xl">
            <CardContent className="py-14 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold">
                {pickedDay ? `No events on ${format(pickedDay, "MMMM d, yyyy")}` : "No events found"}
              </h3>
              <p className="text-muted-foreground mb-5 text-sm">
                {filtersActive ? "Try a different filter or date." : "Create your first event to get started."}
              </p>
              <div className="flex justify-center gap-2">
                {filtersActive && <Button variant="outline" onClick={clearFilters}>Reset filters</Button>}
                <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Event</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-1 text-sm text-muted-foreground">
              <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} id="select-all" />
              <label htmlFor="select-all" className="cursor-pointer">
                Select all · {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
                {pickedDay && ` on ${format(pickedDay, "MMM d, yyyy")}`}
              </label>
            </div>
            {filteredEvents.map(event => {
              const status = statusOf(event);
              const past = !isUpcoming(event, today);
              return (
                <Card key={event.id} className={`rounded-xl transition-colors hover:border-primary/40 ${past ? "opacity-80" : ""}`}>
                  <CardContent className="p-4 flex gap-4">
                    <Checkbox
                      checked={selectedIds.includes(event.id)}
                      onCheckedChange={() => toggleSelection(event.id)}
                      aria-label={`Select ${event.title}`}
                      className="mt-1"
                    />
                    <div className="hidden sm:flex w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-muted py-2">
                      <span className="text-xs uppercase text-muted-foreground">{format(eventStart(event), "MMM")}</span>
                      <span className="text-2xl font-bold leading-none">{format(eventStart(event), "d")}</span>
                      {isMultiDay(event) && (
                        <span className="text-[10px] text-muted-foreground mt-1">to {format(eventEnd(event), "MMM d")}</span>
                      )}
                    </div>
                    {event.image_url && (
                      <img src={event.image_url} alt="" className="hidden md:block w-24 h-24 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge className={status.className}>{status.label}</Badge>
                        <Badge variant="outline">{event.type}</Badge>
                        {isMultiDay(event) && (
                          <Badge variant="outline" className="gap-1"><CalendarRange className="h-3 w-3" /> Multi-day</Badge>
                        )}
                        {(event.is_recurring_parent || event.parent_event_id) && (
                          <Badge variant="outline" className="gap-1"><Repeat className="h-3 w-3" /> Recurring</Badge>
                        )}
                      </div>
                      <h3 className="font-display text-lg font-semibold truncate">{event.title}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatEventRange(event)}</span>
                        {formatEventTime(event) && (
                          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatEventTime(event)}</span>
                        )}
                        <span className="flex items-center gap-1.5 min-w-0"><MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{event.location}</span></span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                      <Button variant="ghost" size="icon" asChild title="View public page">
                        <Link to={eventPath(event)} aria-label={`View ${event.title}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDuplicate(event)} title="Duplicate" aria-label={`Duplicate ${event.title}`}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(event)} title="Edit" aria-label={`Edit ${event.title}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEventToDelete(event)} title="Delete" aria-label={`Delete ${event.title}`} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editing ?? undefined}
        duplicateFrom={duplicating ?? undefined}
        onSuccess={fetchEvents}
      />

      <AlertDialog open={!!eventToDelete} onOpenChange={(o) => !o && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-semibold text-foreground">"{eventToDelete?.title}"</span>? This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} events</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete all selected</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminEvents;
