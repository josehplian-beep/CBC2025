/**
 * Navigation Component
 * 
 * The main navigation bar for the website. Handles both desktop and mobile navigation,
 * user authentication state, theme toggling, and admin access control.
 * 
 * Features:
 * - Responsive design with mobile hamburger menu
 * - Dropdown menus for grouped navigation items
 * - Theme toggle (light/dark mode)
 * - Authentication state management (sign in/out)
 * - Admin dashboard link for administrators
 */

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, Sun, Moon, User as UserIcon } from "lucide-react";
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

// ============================================================================
// Types & Interfaces
// ============================================================================

interface NavLink {
  name: string;
  path: string;
}

interface User {
  id: string;
  email?: string;
}

// ============================================================================
// Navigation Configuration
// ============================================================================

/** Links under the "CBC" dropdown menu */
const CBC_LINKS: NavLink[] = [
  { name: "About", path: "/about" },
  { name: "Our Staffs", path: "/staff" },
  { name: "Departments", path: "/departments" },
];

/** Links under the "Media" dropdown menu */
const MEDIA_LINKS: NavLink[] = [
  { name: "Media Gallery", path: "/media" },
  { name: "Messages", path: "/testimony" },
];

/** Links under the "Resources" dropdown menu */
const RESOURCES_LINKS: NavLink[] = [
  { name: "Get Involved", path: "/get-involved" },
  { name: "Prayer Request", path: "/resources" },
];

// ============================================================================
// Main Component
// ============================================================================

const Navigation = () => {
  // UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [memberProfileId, setMemberProfileId] = useState<string | null>(null);
  
  // Hooks
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  // ============================================================================
  // Authentication Effects
  // ============================================================================

  /**
   * Subscribe to auth state changes and update user state accordingly
   */
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Check if current user has administrator role and fetch their member profile
   */
  useEffect(() => {
    checkAdminStatus();
    fetchMemberProfile();
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

      const hasAdminRole = roles?.some(r => r.role === 'administrator') || false;
      setIsAdmin(hasAdminRole);
    } catch (error) {
      console.error("Failed to check admin status:", error);
      setIsAdmin(false);
    }
  };

  const fetchMemberProfile = async () => {
    if (!user) {
      setMemberProfileId(null);
      return;
    }

    try {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setMemberProfileId(member?.id ?? null);
    } catch (error) {
      console.error("Failed to fetch member profile:", error);
      setMemberProfileId(null);
    }
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Sign the user out and redirect to home page
   */
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

  /**
   * Toggle theme between light and dark mode
   */
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  /**
   * Close mobile menu when navigating
   */
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Check if a path is currently active
   */
  const isActive = (path: string): boolean => location.pathname === path;

  /**
   * Check if the current path starts with a prefix (for admin routes)
   */
  const isPathPrefix = (prefix: string): boolean => location.pathname.startsWith(prefix);

  /**
   * Get the appropriate CSS classes for a nav link based on active state
   */
  const getNavLinkClasses = (path: string): string => {
    const baseClasses = "text-sm font-medium transition-colors hover:text-primary";
    const activeClasses = isActive(path) 
      ? "text-primary font-semibold" 
      : "text-muted-foreground";
    
    return `${baseClasses} ${activeClasses}`;
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo and Theme Toggle */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <img 
                src={cbcLogo} 
                alt="Chin Bethel Church Logo" 
                className="h-12 w-auto transition-transform group-hover:scale-105"
              />
            </Link>
            
            <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
          </div>

          {/* Desktop Navigation */}
          <DesktopNav
            isActive={isActive}
            isPathPrefix={isPathPrefix}
            getNavLinkClasses={getNavLinkClasses}
            isAdmin={isAdmin}
            user={user}
            memberProfileId={memberProfileId}
            onSignOut={handleSignOut}
          />

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-foreground hover:text-primary transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <MobileNav
            isActive={isActive}
            isPathPrefix={isPathPrefix}
            getNavLinkClasses={getNavLinkClasses}
            isAdmin={isAdmin}
            user={user}
            memberProfileId={memberProfileId}
            theme={theme}
            onThemeToggle={toggleTheme}
            onSignOut={handleSignOut}
            onNavigate={closeMobileMenu}
          />
        )}
      </div>
    </nav>
  );
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Theme toggle button with animated sun/moon icons
 */
function ThemeToggleButton({ 
  theme, 
  onToggle 
}: { 
  theme: string; 
  onToggle: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="rounded-full"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

/**
 * Desktop navigation with dropdown menus
 */
function DesktopNav({
  isActive,
  isPathPrefix,
  getNavLinkClasses,
  isAdmin,
  user,
  memberProfileId,
  onSignOut,
}: {
  isActive: (path: string) => boolean;
  isPathPrefix: (prefix: string) => boolean;
  getNavLinkClasses: (path: string) => string;
  isAdmin: boolean;
  user: User | null;
  memberProfileId: string | null;
  onSignOut: () => void;
}) {
  return (
    <div className="hidden md:flex items-center gap-8">
      {/* Home Link */}
      <Link to="/" className={getNavLinkClasses("/")}>
        Home
      </Link>

      {/* CBC Dropdown */}
      <DropdownMenu label="CBC" links={CBC_LINKS} />

      {/* Events Link */}
      <Link to="/events" className={getNavLinkClasses("/events")}>
        Events
      </Link>

      {/* Media Dropdown */}
      <DropdownMenu label="Media" links={MEDIA_LINKS} />

      {/* Member Directory Link */}
      <Link to="/auth" className={getNavLinkClasses("/members")}>
        Member Directory
      </Link>

      {/* Resources Dropdown */}
      <DropdownMenu label="Resources" links={RESOURCES_LINKS} />

      {/* My Profile (visible only to logged-in members with linked profile) */}
      {user && memberProfileId && (
        <Link
          to={`/members/${memberProfileId}`}
          className={`text-sm font-medium transition-colors hover:text-primary ${
            isActive(`/members/${memberProfileId}`) ? "text-primary font-semibold" : "text-muted-foreground"
          }`}
        >
          My Profile
        </Link>
      )}

      {/* Admin Dashboard (visible only to admins) */}
      {isAdmin && (
        <Link
          to="/admin/dashboard"
          className={`text-sm font-medium transition-colors hover:text-primary ${
            isPathPrefix("/admin") ? "text-primary font-semibold" : "text-muted-foreground"
          }`}
        >
          Admin Dashboard
        </Link>
      )}

      {/* Auth Buttons */}
      {user ? (
        <Button size="sm" variant="outline" onClick={onSignOut} className="ml-4">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      ) : (
        <Link to="/auth">
          <Button size="sm" className="ml-4">Sign In</Button>
        </Link>
      )}
    </div>
  );
}

/**
 * Reusable dropdown menu component
 */
function DropdownMenu({ label, links }: { label: string; links: NavLink[] }) {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm font-medium bg-transparent">
            {label}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-48 p-2">
              {links.map((link) => (
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
  );
}

/**
 * Mobile navigation menu
 */
function MobileNav({
  isActive,
  isPathPrefix,
  getNavLinkClasses,
  isAdmin,
  user,
  memberProfileId,
  theme,
  onThemeToggle,
  onSignOut,
  onNavigate,
}: {
  isActive: (path: string) => boolean;
  isPathPrefix: (prefix: string) => boolean;
  getNavLinkClasses: (path: string) => string;
  isAdmin: boolean;
  user: User | null;
  memberProfileId: string | null;
  theme: string;
  onThemeToggle: () => void;
  onSignOut: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className="md:hidden py-4 border-t border-border">
      <div className="flex flex-col gap-4">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onThemeToggle}
          className="justify-start gap-2"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 ml-8" />
          <span className="ml-6">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </Button>

        {/* Home */}
        <Link to="/" onClick={onNavigate} className={getNavLinkClasses("/")}>
          Home
        </Link>

        {/* CBC Section */}
        <MobileMenuSection title="CBC" links={CBC_LINKS} onNavigate={onNavigate} />

        {/* Events */}
        <Link to="/events" onClick={onNavigate} className={getNavLinkClasses("/events")}>
          Events
        </Link>

        {/* Media Section */}
        <MobileMenuSection title="Media" links={MEDIA_LINKS} onNavigate={onNavigate} />

        {/* Member Directory */}
        <Link to="/auth" onClick={onNavigate} className={getNavLinkClasses("/members")}>
          Member Directory
        </Link>

        {/* Resources Section */}
        <MobileMenuSection title="Resources" links={RESOURCES_LINKS} onNavigate={onNavigate} />

        {/* My Profile (visible only to logged-in members with linked profile) */}
        {user && memberProfileId && (
          <Link
            to={`/members/${memberProfileId}`}
            onClick={onNavigate}
            className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 ${
              isActive(`/members/${memberProfileId}`) ? "text-primary font-semibold" : "text-muted-foreground"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            My Profile
          </Link>
        )}

        {/* Admin Dashboard (visible only to admins) */}
        {isAdmin && (
          <Link
            to="/admin/dashboard"
            onClick={onNavigate}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isPathPrefix("/admin") ? "text-primary font-semibold" : "text-muted-foreground"
            }`}
          >
            Admin Dashboard
          </Link>
        )}

        {/* Auth Buttons */}
        {user ? (
          <Button size="sm" variant="outline" onClick={onSignOut} className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        ) : (
          <Link to="/auth" onClick={onNavigate}>
            <Button size="sm" className="w-full">Sign In</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Mobile menu section with title and nested links
 */
function MobileMenuSection({ 
  title, 
  links, 
  onNavigate 
}: { 
  title: string; 
  links: NavLink[]; 
  onNavigate: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted-foreground px-2">{title}</span>
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          onClick={onNavigate}
          className="text-sm font-medium transition-colors hover:text-primary pl-6 text-muted-foreground"
        >
          {link.name}
        </Link>
      ))}
    </div>
  );
}

export default Navigation;
