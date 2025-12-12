import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, X, AlertTriangle, Shield, Phone, User } from "lucide-react";
import { StudentAvatar } from "@/components/StudentAvatar";

interface Student {
  id: string;
  full_name: string;
  photo_url: string | null;
  guardian_name: string;
  guardian_phone: string;
  date_of_birth: string;
}

interface ChildInfo {
  id?: string;
  student_id: string;
  allergies: string[];
  medical_conditions: string[];
  special_needs: string;
  authorized_pickups: string[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
  additional_notes: string;
  photo_consent: boolean;
}

export default function ChildInfoEdit() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [childInfo, setChildInfo] = useState<ChildInfo>({
    student_id: studentId || "",
    allergies: [],
    medical_conditions: [],
    special_needs: "",
    authorized_pickups: [],
    emergency_contact_name: "",
    emergency_contact_phone: "",
    additional_notes: "",
    photo_consent: true,
  });
  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newPickup, setNewPickup] = useState("");

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      // Fetch student
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);

      // Fetch existing child info
      const { data: infoData } = await supabase
        .from("child_info")
        .select("*")
        .eq("student_id", studentId)
        .single();

      if (infoData) {
        setChildInfo({
          ...infoData,
          allergies: infoData.allergies || [],
          medical_conditions: infoData.medical_conditions || [],
          authorized_pickups: infoData.authorized_pickups || [],
          special_needs: infoData.special_needs || "",
          emergency_contact_name: infoData.emergency_contact_name || "",
          emergency_contact_phone: infoData.emergency_contact_phone || "",
          additional_notes: infoData.additional_notes || "",
          photo_consent: infoData.photo_consent ?? true,
        });
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        student_id: studentId,
        allergies: childInfo.allergies,
        medical_conditions: childInfo.medical_conditions,
        special_needs: childInfo.special_needs || null,
        authorized_pickups: childInfo.authorized_pickups,
        emergency_contact_name: childInfo.emergency_contact_name || null,
        emergency_contact_phone: childInfo.emergency_contact_phone || null,
        additional_notes: childInfo.additional_notes || null,
        photo_consent: childInfo.photo_consent,
      };

      if (childInfo.id) {
        const { error } = await supabase
          .from("child_info")
          .update(payload)
          .eq("id", childInfo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("child_info")
          .insert(payload);
        if (error) throw error;
      }

      toast.success("Child information saved");
      navigate(-1);
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error("Failed to save information");
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !childInfo.allergies.includes(newAllergy.trim())) {
      setChildInfo({
        ...childInfo,
        allergies: [...childInfo.allergies, newAllergy.trim()],
      });
      setNewAllergy("");
    }
  };

  const removeAllergy = (allergy: string) => {
    setChildInfo({
      ...childInfo,
      allergies: childInfo.allergies.filter(a => a !== allergy),
    });
  };

  const addCondition = () => {
    if (newCondition.trim() && !childInfo.medical_conditions.includes(newCondition.trim())) {
      setChildInfo({
        ...childInfo,
        medical_conditions: [...childInfo.medical_conditions, newCondition.trim()],
      });
      setNewCondition("");
    }
  };

  const removeCondition = (condition: string) => {
    setChildInfo({
      ...childInfo,
      medical_conditions: childInfo.medical_conditions.filter(c => c !== condition),
    });
  };

  const addPickup = () => {
    if (newPickup.trim() && !childInfo.authorized_pickups.includes(newPickup.trim())) {
      setChildInfo({
        ...childInfo,
        authorized_pickups: [...childInfo.authorized_pickups, newPickup.trim()],
      });
      setNewPickup("");
    }
  };

  const removePickup = (pickup: string) => {
    setChildInfo({
      ...childInfo,
      authorized_pickups: childInfo.authorized_pickups.filter(p => p !== pickup),
    });
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Child Information</h1>
          <p className="text-muted-foreground">Safety and health information for check-in</p>
        </div>
      </div>

      {/* Student Info */}
      {student && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <StudentAvatar
                photoUrl={student.photo_url}
                fullName={student.full_name}
                className="h-16 w-16"
              />
              <div>
                <h2 className="text-xl font-semibold">{student.full_name}</h2>
                <p className="text-muted-foreground">
                  Guardian: {student.guardian_name} • {student.guardian_phone}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allergies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Allergies
          </CardTitle>
          <CardDescription>
            List any food or environmental allergies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {childInfo.allergies.map((allergy) => (
              <Badge key={allergy} variant="destructive" className="gap-1">
                {allergy}
                <button onClick={() => removeAllergy(allergy)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {childInfo.allergies.length === 0 && (
              <span className="text-sm text-muted-foreground">No allergies listed</span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add allergy (e.g., Peanuts)"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAllergy()}
            />
            <Button onClick={addAllergy} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Medical Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Conditions</CardTitle>
          <CardDescription>
            List any medical conditions staff should be aware of
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {childInfo.medical_conditions.map((condition) => (
              <Badge key={condition} variant="secondary" className="gap-1">
                {condition}
                <button onClick={() => removeCondition(condition)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {childInfo.medical_conditions.length === 0 && (
              <span className="text-sm text-muted-foreground">No conditions listed</span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add condition (e.g., Asthma)"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCondition()}
            />
            <Button onClick={addCondition} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Special Needs */}
      <Card>
        <CardHeader>
          <CardTitle>Special Needs</CardTitle>
          <CardDescription>
            Any accommodations or special care instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe any special needs or accommodations..."
            value={childInfo.special_needs}
            onChange={(e) => setChildInfo({ ...childInfo, special_needs: e.target.value })}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Authorized Pickups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authorized Pickups
          </CardTitle>
          <CardDescription>
            People authorized to pick up this child (in addition to primary guardian)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {childInfo.authorized_pickups.map((pickup) => (
              <Badge key={pickup} variant="outline" className="gap-1">
                <User className="h-3 w-3" />
                {pickup}
                <button onClick={() => removePickup(pickup)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {childInfo.authorized_pickups.length === 0 && (
              <span className="text-sm text-muted-foreground">Only primary guardian listed</span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add authorized person's name"
              value={newPickup}
              onChange={(e) => setNewPickup(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPickup()}
            />
            <Button onClick={addPickup} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Contact
          </CardTitle>
          <CardDescription>
            Alternative emergency contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input
                placeholder="Emergency contact name"
                value={childInfo.emergency_contact_name}
                onChange={(e) => setChildInfo({ ...childInfo, emergency_contact_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                placeholder="Phone number"
                value={childInfo.emergency_contact_phone}
                onChange={(e) => setChildInfo({ ...childInfo, emergency_contact_phone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
          <CardDescription>
            Any other information staff should know
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Additional notes..."
            value={childInfo.additional_notes}
            onChange={(e) => setChildInfo({ ...childInfo, additional_notes: e.target.value })}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Photo Consent */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Photo Consent</h3>
              <p className="text-sm text-muted-foreground">
                Allow photos/videos of this child during church activities
              </p>
            </div>
            <Switch
              checked={childInfo.photo_consent}
              onCheckedChange={(checked) => setChildInfo({ ...childInfo, photo_consent: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Information"}
        </Button>
      </div>
    </div>
  );
}
