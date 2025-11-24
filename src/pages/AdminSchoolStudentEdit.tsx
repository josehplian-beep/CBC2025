import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface Class {
  id: string;
  class_name: string;
}

export default function AdminSchoolStudentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    guardian_name: "",
    guardian_phone: "",
    photo_url: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [studentRes, classesRes, assignedRes] = await Promise.all([
        supabase.from("students").select("*").eq("id", id).single(),
        supabase.from("classes").select("id, class_name").order("class_name"),
        supabase.from("student_classes").select("class_id").eq("student_id", id)
      ]);

      if (studentRes.error) throw studentRes.error;
      if (classesRes.error) throw classesRes.error;
      
      setFormData({
        full_name: studentRes.data.full_name || "",
        date_of_birth: studentRes.data.date_of_birth || "",
        guardian_name: studentRes.data.guardian_name || "",
        guardian_phone: studentRes.data.guardian_phone || "",
        photo_url: studentRes.data.photo_url || "",
        notes: studentRes.data.notes || "",
      });
      
      setClasses(classesRes.data || []);
      setAssignedClasses((assignedRes.data || []).map(ac => ac.class_id));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load student");
      navigate("/admin/school/students");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClass = (classId: string) => {
    setAssignedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update student info
      const { error: updateError } = await supabase
        .from("students")
        .update(formData)
        .eq("id", id);

      if (updateError) throw updateError;

      // Delete existing class assignments
      const { error: deleteError } = await supabase
        .from("student_classes")
        .delete()
        .eq("student_id", id);

      if (deleteError) throw deleteError;

      // Insert new class assignments
      if (assignedClasses.length > 0) {
        const { error: insertError } = await supabase
          .from("student_classes")
          .insert(assignedClasses.map(classId => ({
            student_id: id,
            class_id: classId,
            year: new Date().getFullYear().toString()
          })));

        if (insertError) throw insertError;
      }

      toast.success("Student updated successfully");
      navigate("/admin/school/students");
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-center">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/school/students")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Student</h1>
            <p className="text-muted-foreground">Update student information</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guardian_name">Guardian Name *</Label>
                  <Input
                    id="guardian_name"
                    required
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian_phone">Guardian Phone *</Label>
                  <Input
                    id="guardian_phone"
                    required
                    value={formData.guardian_phone}
                    onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo_url">Photo URL</Label>
                <Input
                  id="photo_url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/admin/school/students")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes available</p>
            ) : (
              <div className="space-y-3">
                {classes.map((cls) => (
                  <div key={cls.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`class-${cls.id}`}
                      checked={assignedClasses.includes(cls.id)}
                      onCheckedChange={() => handleToggleClass(cls.id)}
                    />
                    <Label
                      htmlFor={`class-${cls.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {cls.class_name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
