import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, ChevronDown, Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import cbcLogo from "@/assets/cbc-logo.png";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      setIsAdmin(roles?.some(r => r.role === 'admin') || false);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const navLinks = [
    { name: "Events", path: "/events" },
    { name: "Get Involved", path: "/get-involved" },
    { name: "Member Directory", path: "/members" },
  ];

  const cbcSubLinks = [
    { name: "About", path: "/about" },
    { name: "Our Staffs", path: "/about#meet-our-staffs" },
    { name: "Departments", path: "/departments" },
  ];

  const mediaSubLinks = [
    { name: "Media Gallery", path: "/media" },
    { name: "Testimonials", path: "/testimonials" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate("/");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <img 
                src={cbcLogo} 
                alt="Chin Bethel Church Logo" 
                className="h-12 w-auto transition-transform group-hover:scale-105"
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/")
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium bg-transparent">
                    CBC
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-48 p-2">
                      {cbcSubLinks.map((link) => (
                        <NavigationMenuLink key={link.path} asChild>
                          <Link
                            to={link.path}
                            className="block px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                          >
                            {link.name}
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium bg-transparent">
                    Media
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-48 p-2">
                      {mediaSubLinks.map((link) => (
                        <NavigationMenuLink key={link.path} asChild>
                          <Link
                            to={link.path}
                            className="block px-4 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                          >
                            {link.name}
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.path)
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center gap-2 ml-4">
                {isAdmin && (
                  <>
                    <Link to="/admin/albums">
                      <Button size="sm" variant="ghost">
                        Manage Albums
                      </Button>
                    </Link>
                    <Link to="/admin/staff">
                      <Button size="sm" variant="ghost">
                        Manage Staff
                      </Button>
                    </Link>
                    <Link to="/admin/color-palette">
                      <Button size="sm" variant="ghost">
                        Color Palette
                      </Button>
                    </Link>
                  </>
                )}
                <Link to="/profile">
                  <Button size="sm" variant="ghost">
                    Profile
                  </Button>
                </Link>
                <Button size="sm" variant="outline" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="ml-4">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-foreground hover:text-primary transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="justify-start gap-2"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 ml-8" />
                <span className="ml-6">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </Button>
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/")
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                Home
              </Link>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground px-2">CBC</span>
                {cbcSubLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-medium transition-colors hover:text-primary pl-6 text-muted-foreground"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground px-2">Media</span>
                {mediaSubLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-medium transition-colors hover:text-primary pl-6 text-muted-foreground"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.path)
                      ? "text-primary font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <>
                  {isAdmin && (
                    <>
                      <Link to="/admin/albums" onClick={() => setIsOpen(false)}>
                        <Button size="sm" variant="ghost" className="w-full">
                          Manage Albums
                        </Button>
                      </Link>
                      <Link to="/admin/staff" onClick={() => setIsOpen(false)}>
                        <Button size="sm" variant="ghost" className="w-full">
                          Manage Staff
                        </Button>
                      </Link>
                      <Link to="/admin/color-palette" onClick={() => setIsOpen(false)}>
                        <Button size="sm" variant="ghost" className="w-full">
                          Color Palette
                        </Button>
                      </Link>
                    </>
                  )}
                  <Link to="/profile" onClick={() => setIsOpen(false)}>
                    <Button size="sm" variant="ghost" className="w-full">
                      Profile
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={handleSignOut} className="w-full">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
