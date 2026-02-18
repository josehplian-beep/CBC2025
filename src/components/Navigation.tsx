import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "./ThemeProvider";
import cbcLogo from "@/assets/cbc-logo.png";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface NavLink {
  name: string;
  path: string;
}

const cbcLinks: NavLink[] = [
  { name: "About", path: "/about" },
  { name: "Our Staffs", path: "/staff" },
  { name: "Departments", path: "/departments" },
];

const mediaLinks: NavLink[] = [
  { name: "Watch", path: "/media" },
  { name: "Messages", path: "/testimony" },
];

const resourceLinks: NavLink[] = [
  { name: "Get Involved", path: "/get-involved" },
  { name: "Prayer Request", path: "/resources" },
];

const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setMemberId(null);
      return;
    }

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => setIsAdmin(data?.some(r => r.role === "administrator") ?? false));

    supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setMemberId(data?.id ?? null));
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You have been signed out successfully." });
    navigate("/");
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const isActive = (path: string) => location.pathname === path;
  const linkClass = (path: string) =>
    `text-base font-medium transition-colors hover:text-primary ${isActive(path) ? "text-primary font-semibold" : "text-muted-foreground"}`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <img src={cbcLogo} alt="CBC Logo" className="h-12 w-auto transition-transform group-hover:scale-105" />
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={linkClass("/")}>Home</Link>
            <Dropdown label="CBC" links={cbcLinks} />
            <Link to="/events" className={linkClass("/events")}>Events</Link>
            <Dropdown label="Media" links={mediaLinks} />
            <Link to="/auth" className={linkClass("/members")}>Member Directory</Link>
            <Dropdown label="Resources" links={resourceLinks} />
            
            {user && memberId && (
              <Link to={`/members/${memberId}`} className={linkClass(`/members/${memberId}`)}>My Profile</Link>
            )}
            {isAdmin && (
              <Link to="/admin/dashboard" className={`text-base font-medium transition-colors hover:text-primary ${location.pathname.startsWith("/admin") ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                Admin Dashboard
              </Link>
            )}
            {user ? (
              <Button size="sm" variant="outline" onClick={signOut} className="ml-4">
                <LogOut className="w-4 h-4 mr-2" />Sign Out
              </Button>
            ) : (
              <Link to="/auth"><Button size="sm" className="ml-4">Sign In</Button></Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-foreground hover:text-primary">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-border flex flex-col gap-4">
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="justify-start gap-2">
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="h-4 w-4 hidden dark:block" />
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </Button>

            <Link to="/" onClick={() => setMobileOpen(false)} className={linkClass("/")}>Home</Link>
            <MobileSection title="CBC" links={cbcLinks} onClose={() => setMobileOpen(false)} />
            <Link to="/events" onClick={() => setMobileOpen(false)} className={linkClass("/events")}>Events</Link>
            <MobileSection title="Media" links={mediaLinks} onClose={() => setMobileOpen(false)} />
            <Link to="/auth" onClick={() => setMobileOpen(false)} className={linkClass("/members")}>Member Directory</Link>
            <MobileSection title="Resources" links={resourceLinks} onClose={() => setMobileOpen(false)} />

            {user && memberId && (
              <Link to={`/members/${memberId}`} onClick={() => setMobileOpen(false)} className={linkClass(`/members/${memberId}`)}>My Profile</Link>
            )}
            {isAdmin && (
              <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)} className={linkClass("/admin/dashboard")}>Admin Dashboard</Link>
            )}
            {user ? (
              <Button size="sm" variant="outline" onClick={() => { signOut(); setMobileOpen(false); }}>
                <LogOut className="w-4 h-4 mr-2" />Sign Out
              </Button>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)}><Button size="sm">Sign In</Button></Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

function Dropdown({ label, links }: { label: string; links: NavLink[] }) {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-base font-medium bg-transparent">{label}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-48 p-2">
              {links.map(link => (
                <NavigationMenuLink key={link.path} asChild>
                  <Link to={link.path} className="block px-4 py-2 text-base hover:bg-accent rounded-md transition-colors">
                    {link.name}
                  </Link>
                </NavigationMenuLink>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function MobileSection({ title, links, onClose }: { title: string; links: NavLink[]; onClose: () => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      {links.map(link => (
        <Link key={link.path} to={link.path} onClick={onClose} className="block pl-4 text-base text-muted-foreground hover:text-primary">
          {link.name}
        </Link>
      ))}
    </div>
  );
}

export default Navigation;
