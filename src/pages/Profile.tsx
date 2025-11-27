import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, User as UserIcon, Save, AlertTriangle, KeyRound, Camera, Mail, Phone, MapPin, Calendar, Edit, Activity, Shield, Bell } from "lucide-react";
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
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
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
        setPhone((profileData as any).phone || "");
        setBio((profileData as any).bio || "");
        setLocation((profileData as any).location || "");
        setProfileImage((profileData as any).profile_image_url || "");
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
          phone: phone.trim() || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
          profile_image_url: profileImage || null,
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

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword.trim()) {
      toast({
        title: "Validation Error",
        description: "New password is required.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your password has been updated.",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update password';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfileImage(publicUrl);

      toast({
        title: "Success",
        description: "Profile image uploaded successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Hero Section with Profile Picture */}
          <Card className="relative overflow-hidden border-2 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
            <CardContent className="relative pt-12 pb-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative group">
                  <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                    <AvatarImage src={profileImage} alt={fullName} />
                    <AvatarFallback className="text-3xl bg-primary/10">
                      {fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-all shadow-lg group-hover:scale-110">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 text-center md:text-left space-y-2">
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <h1 className="font-display text-4xl font-bold">{fullName || 'Your Name'}</h1>
                    <Badge variant="secondary" className="text-sm">
                      {title || 'Member'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-lg">{bio || 'Update your profile to share more about yourself'}</p>
                  
                  <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                    {email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{email}</span>
                      </div>
                    )}
                    {phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{phone}</span>
                      </div>
                    )}
                    {location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="text-2xl font-bold">
                      {user?.created_at ? new Date(user.created_at).getFullYear() : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-500/10 p-3 rounded-lg">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profile Status</p>
                    <p className="text-2xl font-bold">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-500/10 p-3 rounded-lg">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Security</p>
                    <p className="text-2xl font-bold">Good</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              <TabsTrigger value="profile" className="gap-2 py-3">
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Profile Info</span>
                <span className="sm:hidden">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2 py-3">
                <KeyRound className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
                <span className="sm:hidden">Security</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2 py-3">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
                <span className="sm:hidden">Alerts</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="font-display text-2xl flex items-center gap-2">
                    <UserIcon className="w-6 h-6 text-primary" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your profile details and personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!profile && (
                    <Alert className="mb-6">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Complete your profile to get the most out of your membership
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
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
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="title" className="flex items-center gap-2">
                          <Badge className="w-4 h-4" />
                          Title / Position
                        </Label>
                        <Input
                          id="title"
                          type="text"
                          placeholder="e.g., Senior Pastor, Youth Minister"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          disabled={saving}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Contact Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={saving}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={saving}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location" className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location
                        </Label>
                        <Input
                          id="location"
                          type="text"
                          placeholder="City, State"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          disabled={saving}
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        disabled={saving}
                        className="min-h-[120px] resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        {bio.length}/500 characters
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={saving} className="flex-1 h-11">
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving Changes...
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
                        className="h-11"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="font-display text-2xl flex items-center gap-2">
                    <KeyRound className="w-6 h-6 text-primary" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordUpdate} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={updatingPassword}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">
                        New Password <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password (min. 6 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={updatingPassword}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm New Password <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={updatingPassword}
                        className="h-11"
                      />
                    </div>

                    <div className="pt-4">
                      <Button type="submit" disabled={updatingPassword} className="w-full h-11">
                        {updatingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating Password...
                          </>
                        ) : (
                          <>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Update Password
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-2 bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg">Security Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Use a strong password</p>
                      <p className="text-sm text-muted-foreground">
                        Mix uppercase, lowercase, numbers, and symbols
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Never share your password</p>
                      <p className="text-sm text-muted-foreground">
                        Keep your credentials private and secure
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Change regularly</p>
                      <p className="text-sm text-muted-foreground">
                        Update your password every few months
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="font-display text-2xl flex items-center gap-2">
                    <Bell className="w-6 h-6 text-primary" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Manage how you receive updates and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about events and announcements
                      </p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Event Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified about upcoming church events
                      </p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Prayer Requests</p>
                      <p className="text-sm text-muted-foreground">
                        Be notified of new prayer requests
                      </p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Newsletter</p>
                      <p className="text-sm text-muted-foreground">
                        Receive monthly church newsletter
                      </p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                  </div>

                  <Button className="w-full h-11">
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
