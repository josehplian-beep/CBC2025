/**
 * Profile Page - Unified Redirect
 * 
 * This page redirects authenticated users to their linked Member Profile page.
 * If a user doesn't have a linked member record, they are shown options to
 * contact an administrator to link their account.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, UserCircle, Mail, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserEmail(session.user.email || null);

      // Check if user has a linked member record
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (memberError) {
        console.error("Error checking member link:", memberError);
        setError("Unable to load your profile. Please try again later.");
        setLoading(false);
        return;
      }

      if (member) {
        // User has a linked member record - redirect to their member profile
        navigate(`/members/${member.id}`, { replace: true });
      } else {
        // No linked member record - show info message
        setLoading(false);
      }
    } catch (err) {
      console.error("Profile redirect error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center mt-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 mt-20">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <CardTitle>Error Loading Profile</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // No linked member record - show info card
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-lg mx-auto">
          <Card className="shadow-xl border-2">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <UserCircle className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl">
                Profile Not Linked
              </CardTitle>
              <CardDescription className="text-base">
                Your account is not yet linked to a member profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-blue-500/5 border-blue-500/20">
                <Mail className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <span className="font-medium">Signed in as:</span> {userEmail}
                </AlertDescription>
              </Alert>

              <div className="space-y-3 text-center">
                <p className="text-muted-foreground">
                  To access your full member profile, please contact a church administrator 
                  to link your account to your member record.
                </p>
                <p className="text-sm text-muted-foreground">
                  Once linked, you'll be able to view and edit your profile information, 
                  see family members, and access personalized features.
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Button 
                  onClick={() => navigate("/get-involved")} 
                  className="w-full shadow-md"
                >
                  Contact Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/")} 
                  className="w-full"
                >
                  Return Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
