import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSessionAndRedirect = async (session: any) => {
      if (session) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);
        
        const isAdministrator = roles?.some(r => r.role === 'administrator');
        const isStaff = roles?.some(r => r.role === 'staff');
        
        if (isAdministrator || isStaff) {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkSessionAndRedirect(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkSessionAndRedirect(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Sign in failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Reset email sent!",
        description: "Check your email for the password reset link.",
      });
      setIsResetMode(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Reset failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          {/* Tab Navigation */}
          <div className="flex justify-center gap-2 mb-8">
            <button
              type="button"
              onClick={() => setIsResetMode(false)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                !isResetMode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setIsResetMode(true)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                isResetMode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Reset your password
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-8">
            <form onSubmit={isResetMode ? handlePasswordReset : handleSignIn} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold uppercase tracking-wide">
                  Username<span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 bg-muted/50 border-2 border-border focus:border-primary rounded-lg"
                />
              </div>

              {/* Password Field */}
              {!isResetMode && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold uppercase tracking-wide">
                    Password<span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 bg-muted/50 border-2 border-border focus:border-primary rounded-lg pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold uppercase tracking-wide rounded-full"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  isResetMode ? "Send Reset Link" : "Log In"
                )}
              </Button>
            </form>
          </div>

          {/* Help Text */}
          <p className="text-sm text-muted-foreground text-center mt-6">
            Contact church administration for access credentials.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;
