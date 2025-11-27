import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, UserPlus, X, Users, GraduationCap, Loader2, UserCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Class {
  id: string;
  class_name: string;
  description: string | null;
  teacher_id: string | null;
  teachers?: {
    full_name: string;
  };
}

interface Student {
  id: string;
  full_name: string;
  date_of_birth: string;
  photo_url: string | null;
}

interface AssignedStudent extends Student {
  assignment_id: string;
}

interface Teacher {
  id: string;
  full_name: string;
  email: string | null;
  photo_url: string | null;
}

export default function AdminSchoolAssignments() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<AssignedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchAssignedStudents(selectedClass.id);
    }
  }, [selectedClass]);

  const fetchData = async () => {
    try {
      const [classesData, studentsData, teachersData] = await Promise.all([
        supabase
          .from("classes")
          .select("*, teachers(full_name)")
          .order("class_name"),
        supabase
          .from("students")
          .select("*")
          .order("full_name"),
        supabase
          .from("teachers")
          .select("*")
          .order("full_name")
      ]);

      if (classesData.error) throw classesData.error;
      if (studentsData.error) throw studentsData.error;
      if (teachersData.error) throw teachersData.error;

      setClasses(classesData.data || []);
      setAllStudents(studentsData.data || []);
      setTeachers(teachersData.data || []);

      if (classesData.data && classesData.data.length > 0) {
        setSelectedClass(classesData.data[0]);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedStudents = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from("student_classes")
        .select("id, students(*)")
        .eq("class_id", classId)
        .eq("year", "2024-2025");

      if (error) throw error;

      const students = data.map(item => ({
        ...item.students,
        assignment_id: item.id
      })) as AssignedStudent[];

      setAssignedStudents(students);
    } catch (error: any) {
      console.error("Error fetching assigned students:", error);
      toast.error("Failed to load assigned students");
    }
  };

  const handleAssignStudents = async () => {
    if (!selectedClass || selectedStudentIds.length === 0) return;

    setAssigning(true);
    try {
      const assignments = selectedStudentIds.map(studentId => ({
        student_id: studentId,
        class_id: selectedClass.id,
        year: "2024-2025"
      }));

      const { error } = await supabase
        .from("student_classes")
        .insert(assignments);

      if (error) throw error;

      toast.success(`Assigned ${selectedStudentIds.length} student(s) to ${selectedClass.class_name}`);
      setOpen(false);
      setSelectedStudentIds([]);
      fetchAssignedStudents(selectedClass.id);
    } catch (error: any) {
      console.error("Error assigning students:", error);
      toast.error("Failed to assign students");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveStudent = async (assignmentId: string, studentName: string) => {
    if (!selectedClass) return;

    try {
      const { error } = await supabase
        .from("student_classes")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success(`Removed ${studentName} from ${selectedClass.class_name}`);
      fetchAssignedStudents(selectedClass.id);
    } catch (error: any) {
      console.error("Error removing student:", error);
      toast.error("Failed to remove student");
    }
  };

  const availableStudents = allStudents.filter(
    student => !assignedStudents.some(assigned => assigned.id === student.id)
  );

  const filteredAvailableStudents = availableStudents.filter(student =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAssignTeacher = async () => {
    if (!selectedClass || !selectedTeacherId) return;

    try {
      const { error } = await supabase
        .from("classes")
        .update({ teacher_id: selectedTeacherId })
        .eq("id", selectedClass.id);

      if (error) throw error;

      toast.success("Teacher assigned successfully");
      setTeacherDialogOpen(false);
      setSelectedTeacherId("");
      fetchData();
    } catch (error: any) {
      console.error("Error assigning teacher:", error);
      toast.error("Failed to assign teacher");
    }
  };

  const handleRemoveTeacher = async () => {
    if (!selectedClass) return;

    try {
      const { error } = await supabase
        .from("classes")
        .update({ teacher_id: null })
        .eq("id", selectedClass.id);

      if (error) throw error;

      toast.success("Teacher removed from class");
      fetchData();
    } catch (error: any) {
      console.error("Error removing teacher:", error);
      toast.error("Failed to remove teacher");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-accent to-primary/80 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-card-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-accent to-primary/80 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card/95 backdrop-blur-sm p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Student-Class Assignments</h1>
              <p className="text-muted-foreground mt-1">Manage which students are enrolled in each class</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/admin/school/classes")}>
              Back to Classes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classes List */}
          <Card className="bg-card/95 backdrop-blur-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-2">
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className={`w-full p-4 rounded-lg text-left transition-all ${
                        selectedClass?.id === cls.id
                          ? "bg-accent text-accent-foreground shadow-md"
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <h3 className="font-semibold">{cls.class_name}</h3>
                      {cls.teachers && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Teacher: {cls.teachers.full_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {assignedStudents.length} students
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Assignments Management */}
          <Card className="bg-card/95 backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedClass ? `Manage ${selectedClass.class_name}` : "Select a Class"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedClass ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a class to manage assignments</p>
                </div>
              ) : (
                <Tabs defaultValue="students" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="students">
                      <Users className="h-4 w-4 mr-2" />
                      Students
                    </TabsTrigger>
                    <TabsTrigger value="teacher">
                      <UserCog className="h-4 w-4 mr-2" />
                      Teacher
                    </TabsTrigger>
                  </TabsList>

                  {/* Students Tab */}
                  <TabsContent value="students" className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Assigned Students</h3>
                      <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-accent hover:bg-accent/90">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Students
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Students to {selectedClass.class_name}</DialogTitle>
                        <DialogDescription>
                          Select students to assign to this class
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>

                        <ScrollArea className="h-[400px] border rounded-lg p-4">
                          {filteredAvailableStudents.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p>No available students found</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {filteredAvailableStudents.map((student) => (
                                <div
                                  key={student.id}
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                                  onClick={() => toggleStudentSelection(student.id)}
                                >
                                  <Checkbox
                                    checked={selectedStudentIds.includes(student.id)}
                                    onCheckedChange={() => toggleStudentSelection(student.id)}
                                  />
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={student.photo_url || ""} />
                                    <AvatarFallback>
                                      {student.full_name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-medium">{student.full_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Age: {new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>

                        <div className="flex justify-between items-center pt-4 border-t">
                          <p className="text-sm text-muted-foreground">
                            {selectedStudentIds.length} student(s) selected
                          </p>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setOpen(false)}>
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAssignStudents}
                              disabled={selectedStudentIds.length === 0 || assigning}
                              className="bg-accent hover:bg-accent/90"
                            >
                              {assigning ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Plus className="h-4 w-4 mr-2" />
                              )}
                              Assign {selectedStudentIds.length > 0 && `(${selectedStudentIds.length})`}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                    </div>

                    {assignedStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No students assigned to this class yet</p>
                  <Button
                    onClick={() => setOpen(true)}
                    className="mt-4 bg-accent hover:bg-accent/90"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Students
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignedStudents.map((student) => (
                      <Card key={student.id} className="relative">
                        <CardContent className="p-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveStudent(student.assignment_id, student.full_name)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={student.photo_url || ""} />
                              <AvatarFallback>
                                {student.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{student.full_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Age: {new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()} years
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
                  </TabsContent>

                  {/* Teacher Tab */}
                  <TabsContent value="teacher" className="mt-6">
                    <div className="space-y-4">
                      {selectedClass.teacher_id ? (
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                  <AvatarImage src={teachers.find(t => t.id === selectedClass.teacher_id)?.photo_url || ""} />
                                  <AvatarFallback>
                                    {teachers.find(t => t.id === selectedClass.teacher_id)?.full_name?.charAt(0) || "T"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="text-xl font-semibold">
                                    {teachers.find(t => t.id === selectedClass.teacher_id)?.full_name || "Unknown Teacher"}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {teachers.find(t => t.id === selectedClass.teacher_id)?.email || "No email"}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                onClick={handleRemoveTeacher}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Remove Teacher
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                          <UserCog className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="mb-4">No teacher assigned to this class</p>
                          <Dialog open={teacherDialogOpen} onOpenChange={setTeacherDialogOpen}>
                            <DialogTrigger asChild>
                              <Button className="bg-accent hover:bg-accent/90">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign Teacher
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign Teacher to {selectedClass.class_name}</DialogTitle>
                                <DialogDescription>
                                  Select a teacher to assign to this class
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a teacher" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {teachers.map((teacher) => (
                                      <SelectItem key={teacher.id} value={teacher.id}>
                                        <div className="flex items-center gap-2">
                                          <span>{teacher.full_name}</span>
                                          {teacher.email && (
                                            <span className="text-xs text-muted-foreground">({teacher.email})</span>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setTeacherDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleAssignTeacher}
                                    disabled={!selectedTeacherId}
                                    className="bg-accent hover:bg-accent/90"
                                  >
                                    Assign Teacher
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}

                      {selectedClass.teacher_id && (
                        <div className="flex justify-center pt-4">
                          <Dialog open={teacherDialogOpen} onOpenChange={setTeacherDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline">
                                <UserCog className="h-4 w-4 mr-2" />
                                Change Teacher
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Change Teacher for {selectedClass.class_name}</DialogTitle>
                                <DialogDescription>
                                  Select a new teacher to assign to this class
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a teacher" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {teachers.map((teacher) => (
                                      <SelectItem key={teacher.id} value={teacher.id}>
                                        <div className="flex items-center gap-2">
                                          <span>{teacher.full_name}</span>
                                          {teacher.email && (
                                            <span className="text-xs text-muted-foreground">({teacher.email})</span>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setTeacherDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleAssignTeacher}
                                    disabled={!selectedTeacherId}
                                    className="bg-accent hover:bg-accent/90"
                                  >
                                    Assign Teacher
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
