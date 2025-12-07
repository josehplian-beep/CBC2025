import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, ArrowRight, Sparkles, Users, Shield } from "lucide-react";

// ============================================================================
// Feature Cards Data
// ============================================================================

const features = [
  {
    icon: Users,
    title: "Member Directory",
    description: "Connect with your church family",
  },
  {
    icon: Shield,
    title: "Secure Access",
    description: "Your data is protected and private",
  },
  {
    icon: Sparkles,
    title: "Stay Updated",
    description: "Get the latest church news and events",
  },
];

// ============================================================================
// Main Component
// ============================================================================

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="min-h-screen pt-20 flex">
        {/* Left Side - Decorative Panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 animate-fade-in">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-4">
                Welcome to
                <span className="block text-primary mt-2">Chin Bethel Church</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-12 max-w-md">
                Access your member portal to stay connected with our church community.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 group animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md animate-fade-in">
            {/* Form Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 animate-scale-in">
                {isResetMode ? (
                  <Mail className="w-8 h-8 text-primary" />
                ) : (
                  <Lock className="w-8 h-8 text-primary" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {isResetMode ? "Reset Password" : "Staff Sign In"}
              </h2>
              <p className="text-muted-foreground mt-2">
                {isResetMode
                  ? "Enter your email to receive a reset link"
                  : "Enter your credentials to access the portal"}
              </p>
            </div>

            {/* Login Form */}
            <form
              onSubmit={isResetMode ? handlePasswordReset : handleSignIn}
              className="space-y-5"
            >
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className={`relative transition-all duration-300 ${isFocused === 'email' ? 'scale-[1.02]' : ''}`}>
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${isFocused === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFocused('email')}
                    onBlur={() => setIsFocused(null)}
                    required
                    disabled={loading}
                    className="pl-10 h-12 bg-muted/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              {!isResetMode && (
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className={`relative transition-all duration-300 ${isFocused === 'password' ? 'scale-[1.02]' : ''}`}>
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${isFocused === 'password' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setIsFocused('password')}
                      onBlur={() => setIsFocused(null)}
                      required
                      disabled={loading}
                      className="pl-10 h-12 bg-muted/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isResetMode ? "Sending..." : "Signing in..."}
                    </>
                  ) : (
                    <>
                      {isResetMode ? "Send Reset Link" : "Sign In"}
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center space-y-4">
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(!isResetMode);
                  setPassword("");
                }}
                disabled={loading}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {isResetMode ? "← Back to sign in" : "Forgot your password?"}
              </button>

              {!isResetMode && (
                <p className="text-sm text-muted-foreground">
                  Contact church administration for access credentials.
                </p>
              )}
            </div>

            {/* Decorative Element */}
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                Protected by industry-standard encryption
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;
