import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Upload } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

export default function AdminSchoolTeacherEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdministrator, loading: permLoading } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    photo_url: "",
    bio: "",
  });

  useEffect(() => {
    if (!permLoading && !isAdministrator) {
      toast.error("Only administrators can edit teachers");
      navigate("/admin/school/teachers");
    }
  }, [isAdministrator, permLoading, navigate]);

  useEffect(() => {
    fetchTeacher();
  }, [id]);

  const fetchTeacher = async () => {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      setFormData({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        photo_url: data.photo_url || "",
        bio: data.bio || "",
      });
    } catch (error) {
      console.error("Error fetching teacher:", error);
      toast.error("Failed to load teacher");
      navigate("/admin/school/teachers");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('teacher-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('teacher-photos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, photo_url: publicUrl });
      toast.success("Photo uploaded successfully");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("teachers")
        .update(formData)
        .eq("id", id);

      if (error) throw error;

      toast.success("Teacher updated successfully");
      navigate("/admin/school/teachers");
    } catch (error) {
      console.error("Error updating teacher:", error);
      toast.error("Failed to update teacher");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/school/teachers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Teacher</h1>
          <p className="text-muted-foreground">Update teacher information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Information</CardTitle>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-4">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.photo_url} />
                  <AvatarFallback className="text-2xl">
                    {formData.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload Photo"}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG or WEBP (max 5MB)
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/admin/school/teachers")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}