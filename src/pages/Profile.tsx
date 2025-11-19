import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User as UserIcon, Save, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  title: string | null;
  email: string | null;
}

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name);
        setTitle(profileData.title || "");
        setEmail(profileData.email || "");
      } else {
        // No profile exists yet, use defaults
        setEmail(session.user.email || "");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name is required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in again to save your profile.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Profile is automatically created by trigger, so we only need to update
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          title: title.trim() || null,
          email: email.trim() || null,
        })
        .eq('user_id', session.user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your profile has been saved.",
      });

      await loadProfile();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save profile';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center mt-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 mt-20">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                You must be signed in to view your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/auth")} className="w-full">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display text-2xl">Your Profile</CardTitle>
                  <CardDescription>
                    Manage your staff profile information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!profile && (
                <Alert className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You haven't set up your profile yet. Please fill in your information below.
                  </AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title / Position</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="e.g., Senior Pastor, Youth Minister"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Profile
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/")}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
