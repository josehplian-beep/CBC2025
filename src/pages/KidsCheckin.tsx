import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Search, UserPlus, Printer, AlertTriangle, Check, X, QrCode, Users } from "lucide-react";
import { StudentAvatar } from "@/components/StudentAvatar";
import { format } from "date-fns";

interface Session {
  id: string;
  name: string;
  session_type: string;
  session_date: string;
  location: string | null;
  class_id: string | null;
}

interface Student {
  id: string;
  full_name: string;
  photo_url: string | null;
  guardian_name: string;
  guardian_phone: string;
  date_of_birth: string;
}

interface ChildInfo {
  student_id: string;
  allergies: string[] | null;
  medical_conditions: string[] | null;
  special_needs: string | null;
  authorized_pickups: string[] | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

interface Checkin {
  id: string;
  student_id: string | null;
  guest_name: string | null;
  security_code: string;
  checkin_time: string;
  is_checked_out: boolean;
  notes: string | null;
}

const generateSecurityCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function KidsCheckin() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [childInfoMap, setChildInfoMap] = useState<Record<string, ChildInfo>>({});
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [headcount, setHeadcount] = useState<number>(0);
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestNotes, setGuestNotes] = useState("");
  const [printLabel, setPrintLabel] = useState<{childName: string; className: string; code: string; allergies: string[]} | null>(null);
  const [activeTab, setActiveTab] = useState("checkin");

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  const fetchData = async () => {
    try {
      // Fetch session
      const { data: sessionData, error: sessionError } = await supabase
        .from("checkin_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Fetch all students (or class-specific if session has class_id)
      let studentsQuery = supabase.from("students").select("*").order("full_name");
      
      if (sessionData.class_id) {
        const { data: studentIds } = await supabase
          .from("student_classes")
          .select("student_id")
          .eq("class_id", sessionData.class_id);
        
        if (studentIds && studentIds.length > 0) {
          const ids = studentIds.map(s => s.student_id);
          studentsQuery = supabase.from("students").select("*").in("id", ids).order("full_name");
        }
      }

      const { data: studentsData, error: studentsError } = await studentsQuery;
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch child info
      const { data: childInfoData } = await supabase
        .from("child_info")
        .select("*");
      
      const infoMap: Record<string, ChildInfo> = {};
      childInfoData?.forEach(info => {
        infoMap[info.student_id] = info;
      });
      setChildInfoMap(infoMap);

      // Fetch existing check-ins for this session
      const { data: checkinsData, error: checkinsError } = await supabase
        .from("checkins")
        .select("*")
        .eq("session_id", sessionId)
        .order("checkin_time", { ascending: false });

      if (checkinsError) throw checkinsError;
      setCheckins(checkinsData || []);
      setHeadcount(sessionData.headcount || 0);

    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load check-in data");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const code = generateSecurityCode();
    const childInfo = childInfoMap[studentId];

    try {
      const { error } = await supabase.from("checkins").insert({
        session_id: sessionId,
        student_id: studentId,
        security_code: code,
      });

      if (error) throw error;

      toast.success(`${student.full_name} checked in`);
      
      // Show print dialog
      setPrintLabel({
        childName: student.full_name,
        className: session?.name || "",
        code,
        allergies: childInfo?.allergies || [],
      });

      fetchData();
    } catch (error: any) {
      console.error("Error checking in:", error);
      toast.error("Failed to check in");
    }
  };

  const handleBulkCheckIn = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Select at least one student");
      return;
    }

    try {
      const records = selectedStudents.map(studentId => ({
        session_id: sessionId,
        student_id: studentId,
        security_code: generateSecurityCode(),
      }));

      const { error } = await supabase.from("checkins").insert(records);
      if (error) throw error;

      toast.success(`${selectedStudents.length} students checked in`);
      setSelectedStudents([]);
      fetchData();
    } catch (error: any) {
      console.error("Error bulk checking in:", error);
      toast.error("Failed to check in students");
    }
  };

  const handleCheckOut = async (checkinId: string) => {
    try {
      const { error } = await supabase
        .from("checkins")
        .update({ 
          is_checked_out: true, 
          checkout_time: new Date().toISOString() 
        })
        .eq("id", checkinId);

      if (error) throw error;
      toast.success("Checked out successfully");
      fetchData();
    } catch (error: any) {
      console.error("Error checking out:", error);
      toast.error("Failed to check out");
    }
  };

  const handleGuestCheckIn = async () => {
    if (!guestName.trim()) {
      toast.error("Please enter guest name");
      return;
    }

    const code = generateSecurityCode();

    try {
      const { error } = await supabase.from("checkins").insert({
        session_id: sessionId,
        guest_name: guestName,
        security_code: code,
        notes: guestNotes || null,
      });

      if (error) throw error;

      toast.success(`Guest ${guestName} checked in`);
      setPrintLabel({
        childName: guestName,
        className: session?.name || "",
        code,
        allergies: [],
      });

      setIsGuestDialogOpen(false);
      setGuestName("");
      setGuestNotes("");
      fetchData();
    } catch (error: any) {
      console.error("Error checking in guest:", error);
      toast.error("Failed to check in guest");
    }
  };

  const handleHeadcountUpdate = async () => {
    try {
      const { error } = await supabase
        .from("checkin_sessions")
        .update({ headcount })
        .eq("id", sessionId);

      if (error) throw error;
      toast.success("Headcount updated");
    } catch (error: any) {
      console.error("Error updating headcount:", error);
      toast.error("Failed to update headcount");
    }
  };

  const handlePrint = () => {
    if (!printLabel) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print labels");
      return;
    }

    const hasAllergies = printLabel.allergies.length > 0;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Check-In Label</title>
        <style>
          @page { size: 4in 2in; margin: 0; }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 10px; 
            display: flex;
            gap: 10px;
          }
          .label {
            border: 2px solid #000;
            padding: 10px;
            width: 180px;
            height: 100px;
            box-sizing: border-box;
          }
          .child-label { }
          .parent-label { border-style: dashed; }
          .name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .class { font-size: 12px; color: #666; margin-bottom: 5px; }
          .code { font-size: 24px; font-weight: bold; text-align: center; margin: 10px 0; letter-spacing: 3px; }
          .allergies { color: red; font-weight: bold; font-size: 11px; }
          .date { font-size: 10px; color: #999; }
        </style>
      </head>
      <body>
        <div class="label child-label">
          <div class="name">${printLabel.childName}</div>
          <div class="class">${printLabel.className}</div>
          <div class="code">${printLabel.code}</div>
          ${hasAllergies ? `<div class="allergies">⚠️ ${printLabel.allergies.join(", ")}</div>` : ""}
          <div class="date">${format(new Date(), "MMM d, yyyy h:mm a")}</div>
        </div>
        <div class="label parent-label">
          <div style="font-size: 10px; color: #666;">PARENT PICKUP TAG</div>
          <div class="name">${printLabel.childName}</div>
          <div class="class">${printLabel.className}</div>
          <div class="code">${printLabel.code}</div>
          <div class="date">${format(new Date(), "MMM d, yyyy")}</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredStudents = students.filter(student => {
    const isAlreadyCheckedIn = checkins.some(c => c.student_id === student.id && !c.is_checked_out);
    if (isAlreadyCheckedIn) return false;
    return student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           student.guardian_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const checkedInStudents = checkins.filter(c => !c.is_checked_out);
  const checkedOutStudents = checkins.filter(c => c.is_checked_out);

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/school/checkin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{session?.name}</h1>
            <p className="text-muted-foreground">
              {session?.session_date && format(new Date(session.session_date), "MMMM d, yyyy")}
              {session?.location && ` • ${session.location}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Headcount:</Label>
            <Input
              type="number"
              value={headcount}
              onChange={(e) => setHeadcount(parseInt(e.target.value) || 0)}
              className="w-20"
              min={0}
            />
            <Button variant="outline" size="sm" onClick={handleHeadcountUpdate}>
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{checkedInStudents.length}</div>
            <p className="text-sm text-muted-foreground">Currently Checked In</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{checkedOutStudents.length}</div>
            <p className="text-sm text-muted-foreground">Checked Out</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{headcount || "-"}</div>
            <p className="text-sm text-muted-foreground">Headcount</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="checkin">Check In</TabsTrigger>
          <TabsTrigger value="checked-in">
            Currently In ({checkedInStudents.length})
          </TabsTrigger>
          <TabsTrigger value="checked-out">
            Checked Out ({checkedOutStudents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or guardian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isGuestDialogOpen} onOpenChange={setIsGuestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Guest
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Check In Guest</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Guest Name</Label>
                    <Input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Enter child's name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (allergies, parent name, etc.)</Label>
                    <Input
                      value={guestNotes}
                      onChange={(e) => setGuestNotes(e.target.value)}
                      placeholder="Any special notes"
                    />
                  </div>
                  <Button onClick={handleGuestCheckIn} className="w-full">
                    Check In Guest
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {selectedStudents.length > 0 && (
              <Button onClick={handleBulkCheckIn}>
                Check In {selectedStudents.length} Selected
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {filteredStudents.map((student) => {
                    const childInfo = childInfoMap[student.id];
                    const hasAllergies = childInfo?.allergies && childInfo.allergies.length > 0;
                    const hasSpecialNeeds = childInfo?.special_needs;

                    return (
                      <div
                        key={student.id}
                        className="flex items-center gap-4 p-4 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStudents([...selectedStudents, student.id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                            }
                          }}
                        />
                        <StudentAvatar
                          photoUrl={student.photo_url}
                          fullName={student.full_name}
                          className="h-12 w-12"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{student.full_name}</span>
                            {hasAllergies && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Allergies
                              </Badge>
                            )}
                            {hasSpecialNeeds && (
                              <Badge variant="outline" className="text-xs">
                                Special Needs
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Guardian: {student.guardian_name}
                          </p>
                          {hasAllergies && (
                            <p className="text-xs text-destructive">
                              {childInfo.allergies?.join(", ")}
                            </p>
                          )}
                        </div>
                        <Button onClick={() => handleCheckIn(student.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Check In
                        </Button>
                      </div>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      {searchQuery ? "No students found" : "All students are checked in"}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checked-in" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Currently Checked In
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {checkedInStudents.map((checkin) => {
                    const student = students.find(s => s.id === checkin.student_id);
                    const childInfo = student ? childInfoMap[student.id] : null;

                    return (
                      <div
                        key={checkin.id}
                        className="flex items-center gap-4 p-4 hover:bg-muted/50"
                      >
                        {student ? (
                          <StudentAvatar
                            photoUrl={student.photo_url}
                            fullName={student.full_name}
                            className="h-12 w-12"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {student?.full_name || checkin.guest_name}
                            </span>
                            {checkin.guest_name && (
                              <Badge variant="secondary">Guest</Badge>
                            )}
                            {childInfo?.allergies && childInfo.allergies.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {childInfo.allergies.join(", ")}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Code: <strong className="font-mono">{checkin.security_code}</strong></span>
                            <span>In: {format(new Date(checkin.checkin_time), "h:mm a")}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPrintLabel({
                                childName: student?.full_name || checkin.guest_name || "Guest",
                                className: session?.name || "",
                                code: checkin.security_code,
                                allergies: childInfo?.allergies || [],
                              });
                            }}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCheckOut(checkin.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Check Out
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {checkedInStudents.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No one currently checked in
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checked-out" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Checked Out</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {checkedOutStudents.map((checkin) => {
                    const student = students.find(s => s.id === checkin.student_id);

                    return (
                      <div
                        key={checkin.id}
                        className="flex items-center gap-4 p-4 opacity-60"
                      >
                        {student ? (
                          <StudentAvatar
                            photoUrl={student.photo_url}
                            fullName={student.full_name}
                            className="h-10 w-10"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <span className="font-medium">
                            {student?.full_name || checkin.guest_name}
                          </span>
                          <div className="text-sm text-muted-foreground">
                            Code: {checkin.security_code}
                          </div>
                        </div>
                        <Badge variant="outline">Checked Out</Badge>
                      </div>
                    );
                  })}
                  {checkedOutStudents.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No check-outs yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print Label Dialog */}
      <Dialog open={!!printLabel} onOpenChange={() => setPrintLabel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Labels</DialogTitle>
          </DialogHeader>
          {printLabel && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Child Label Preview */}
                <div className="border-2 border-foreground rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">CHILD LABEL</div>
                  <div className="font-bold text-lg">{printLabel.childName}</div>
                  <div className="text-sm text-muted-foreground">{printLabel.className}</div>
                  <div className="text-2xl font-mono font-bold my-2 tracking-wider">
                    {printLabel.code}
                  </div>
                  {printLabel.allergies.length > 0 && (
                    <div className="text-destructive text-xs font-bold">
                      ⚠️ {printLabel.allergies.join(", ")}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    {format(new Date(), "MMM d, yyyy h:mm a")}
                  </div>
                </div>

                {/* Parent Pickup Label Preview */}
                <div className="border-2 border-dashed border-foreground rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">PARENT PICKUP TAG</div>
                  <div className="font-bold text-lg">{printLabel.childName}</div>
                  <div className="text-sm text-muted-foreground">{printLabel.className}</div>
                  <div className="text-2xl font-mono font-bold my-2 tracking-wider">
                    {printLabel.code}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Present this tag for pickup
                  </div>
                </div>
              </div>

              <Button onClick={handlePrint} className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                Print Labels
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
