import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Calendar, Users, Clock, MapPin, Play, Square, BarChart3, Search } from "lucide-react";
import { format } from "date-fns";

interface CheckinSession {
  id: string;
  name: string;
  session_type: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  is_active: boolean;
  headcount: number;
  notes: string | null;
  created_at: string;
}

interface Class {
  id: string;
  class_name: string;
}

export default function AdminCheckinSessions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<CheckinSession[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    name: "",
    session_type: "service",
    session_date: new Date().toISOString().split("T")[0],
    start_time: "",
    location: "",
    class_id: "",
  });
  const [checkinCounts, setCheckinCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsResult, classesResult] = await Promise.all([
        supabase
          .from("checkin_sessions")
          .select("*")
          .order("session_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase.from("classes").select("id, class_name").order("class_name"),
      ]);

      if (sessionsResult.error) throw sessionsResult.error;
      if (classesResult.error) throw classesResult.error;

      setSessions(sessionsResult.data || []);
      setClasses(classesResult.data || []);

      // Get check-in counts for each session
      const counts: Record<string, number> = {};
      for (const session of sessionsResult.data || []) {
        const { count } = await supabase
          .from("checkins")
          .select("*", { count: "exact", head: true })
          .eq("session_id", session.id);
        counts[session.id] = count || 0;
      }
      setCheckinCounts(counts);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!newSession.name.trim()) {
      toast.error("Please enter a session name");
      return;
    }

    try {
      const { error } = await supabase.from("checkin_sessions").insert({
        name: newSession.name,
        session_type: newSession.session_type,
        session_date: newSession.session_date,
        start_time: newSession.start_time || null,
        location: newSession.location || null,
        class_id: newSession.class_id || null,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Session created successfully");
      setIsDialogOpen(false);
      setNewSession({
        name: "",
        session_type: "service",
        session_date: new Date().toISOString().split("T")[0],
        start_time: "",
        location: "",
        class_id: "",
      });
      fetchData();
    } catch (error: any) {
      console.error("Error creating session:", error);
      toast.error("Failed to create session");
    }
  };

  const toggleSessionActive = async (session: CheckinSession) => {
    try {
      const { error } = await supabase
        .from("checkin_sessions")
        .update({ is_active: !session.is_active })
        .eq("id", session.id);

      if (error) throw error;

      toast.success(session.is_active ? "Session ended" : "Session started");
      fetchData();
    } catch (error: any) {
      console.error("Error updating session:", error);
      toast.error("Failed to update session");
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || session.session_type === filterType;
    return matchesSearch && matchesType;
  });

  const getSessionTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      service: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      class: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      event: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      group: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };
    return <Badge className={colors[type] || "bg-muted"}>{type}</Badge>;
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Check-In Sessions</h1>
          <p className="text-muted-foreground">Manage attendance and check-in sessions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Check-In Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Session Name</Label>
                <Input
                  id="name"
                  value={newSession.name}
                  onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                  placeholder="e.g., Sunday Morning Service"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Session Type</Label>
                <Select
                  value={newSession.session_type}
                  onValueChange={(value) => setNewSession({ ...newSession, session_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newSession.session_type === "class" && (
                <div className="space-y-2">
                  <Label htmlFor="class">Link to Class</Label>
                  <Select
                    value={newSession.class_id}
                    onValueChange={(value) => setNewSession({ ...newSession, class_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.class_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newSession.session_date}
                    onChange={(e) => setNewSession({ ...newSession, session_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Start Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newSession.start_time}
                    onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newSession.location}
                  onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                  placeholder="e.g., Main Sanctuary"
                />
              </div>
              <Button onClick={handleCreateSession} className="w-full">
                Create Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="service">Services</SelectItem>
            <SelectItem value="class">Classes</SelectItem>
            <SelectItem value="event">Events</SelectItem>
            <SelectItem value="group">Groups</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sessions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSessions.map((session) => (
          <Card key={session.id} className={session.is_active ? "border-green-500 border-2" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{session.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {getSessionTypeBadge(session.session_type)}
                    {session.is_active && (
                      <Badge className="bg-green-500 text-white">Active</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(session.session_date), "MMM d, yyyy")}
                </div>
                {session.start_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {session.start_time.slice(0, 5)}
                  </div>
                )}
              </div>
              {session.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {session.location}
                </div>
              )}
              <div className="flex items-center gap-1 text-sm font-medium">
                <Users className="h-4 w-4" />
                {checkinCounts[session.id] || 0} checked in
                {session.headcount > 0 && ` • ${session.headcount} headcount`}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant={session.is_active ? "destructive" : "default"}
                  size="sm"
                  className="flex-1"
                  onClick={() => toggleSessionActive(session)}
                >
                  {session.is_active ? (
                    <>
                      <Square className="h-4 w-4 mr-1" /> End
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" /> Start
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/admin/school/checkin/${session.id}`)}
                >
                  <Users className="h-4 w-4 mr-1" /> Check In
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/admin/school/checkin/${session.id}/report`)}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No sessions found</p>
          <p className="text-sm">Create a new session to get started</p>
        </div>
      )}
    </div>
  );
}
