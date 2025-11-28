import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2, Users, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Teacher {
  id: string;
  full_name: string;
  email: string | null;
  photo_url: string | null;
}

interface ClassData {
  class_name: string;
  description: string;
  teacher_ids: string[];
}

export default function AdminSchoolClassEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [formData, setFormData] = useState<ClassData>({
    class_name: "",
    description: "",
    teacher_ids: [],
  });

  useEffect(() => {
    if (id) {
      fetchClassData();
    }
    fetchTeachers();
  }, [id]);

  const fetchClassData = async () => {
    try {
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", id)
        .single();

      if (classError) throw classError;

      // Fetch assigned teachers from junction table
      const { data: classTeachers, error: teacherError } = await supabase
        .from("class_teachers")
        .select("teacher_id")
        .eq("class_id", id);

      if (teacherError) throw teacherError;

      setFormData({
        class_name: classData.class_name,
        description: classData.description || "",
        teacher_ids: classTeachers.map((ct) => ct.teacher_id),
      });
    } catch (error) {
      console.error("Error fetching class:", error);
      toast.error("Failed to load class data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("full_name");

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error("Failed to load teachers");
    }
  };

  const handleTeacherToggle = (teacherId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      teacher_ids: checked
        ? [...prev.teacher_ids, teacherId].slice(0, 2) // Max 2 teachers
        : prev.teacher_ids.filter((id) => id !== teacherId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Update class details
      const { error: updateError } = await supabase
        .from("classes")
        .update({
          class_name: formData.class_name,
          description: formData.description,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // Delete existing teacher assignments
      const { error: deleteError } = await supabase
        .from("class_teachers")
        .delete()
        .eq("class_id", id);

      if (deleteError) throw deleteError;

      // Insert new teacher assignments
      if (formData.teacher_ids.length > 0) {
        const { error: insertError } = await supabase
          .from("class_teachers")
          .insert(
            formData.teacher_ids.map((teacher_id) => ({
              class_id: id,
              teacher_id,
            }))
          );

        if (insertError) throw insertError;
      }

      toast.success("Class updated successfully");
      navigate("/admin/school/classes");
    } catch (error) {
      console.error("Error updating class:", error);
      toast.error("Failed to update class");
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("classes").delete().eq("id", id);

      if (error) throw error;

      toast.success("Class deleted successfully");
      navigate("/admin/school/classes");
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-background flex items-center justify-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-background">
      <div className="bg-gradient-to-r from-primary via-accent to-primary p-8 mb-6 rounded-b-2xl shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/school/classes")}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-display font-bold text-primary-foreground">Edit Class</h1>
              <p className="text-primary-foreground/80 text-lg">Update class information and assign teachers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-2 shadow-lg rounded-2xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
            <CardHeader className="bg-gradient-to-br from-card via-card to-secondary/20">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                Class Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class_name">Class Name *</Label>
                <Input
                  id="class_name"
                  required
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  className="h-12 text-lg rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="text-lg rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg rounded-2xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-accent via-primary to-accent"></div>
            <CardHeader className="bg-gradient-to-br from-card via-card to-secondary/20">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Assign Teachers (Select up to 2)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {formData.teacher_ids.length >= 2 && (
                <Badge className="mb-4 bg-accent">
                  Maximum of 2 teachers reached
                </Badge>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teachers.map((teacher) => {
                  const isSelected = formData.teacher_ids.includes(teacher.id);
                  const isDisabled = formData.teacher_ids.length >= 2 && !isSelected;

                  return (
                    <div
                      key={teacher.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md"
                          : isDisabled
                          ? "border-muted bg-muted/30 opacity-50"
                          : "border-border hover:border-primary/50 hover:shadow-md"
                      }`}
                    >
                      <Checkbox
                        id={teacher.id}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={(checked) => handleTeacherToggle(teacher.id, checked as boolean)}
                        className="mt-1"
                      />
                      <label
                        htmlFor={teacher.id}
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                      >
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage src={teacher.photo_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                            {teacher.full_name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{teacher.full_name}</p>
                          {teacher.email && (
                            <p className="text-sm text-muted-foreground truncate">{teacher.email}</p>
                          )}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  className="rounded-xl shadow-md"
                >
                  <Trash2 className="mr-2 h-5 w-5" />
                  Delete Class
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this class and all associated data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button type="submit" size="lg" className="rounded-xl shadow-md bg-gradient-to-r from-primary to-accent">
              <Save className="mr-2 h-5 w-5" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
