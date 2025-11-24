import { NavLink } from "react-router-dom";
import { User, Image, Users, Palette, LayoutDashboard, LogOut, MessageSquare, Calendar, Heart, Shield, Settings, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

interface MenuSection {
  label: string;
  items: MenuItem[];
}

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  iconColor: string;
  roles: string[];
}

const adminMenuSections: MenuSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, iconColor: "text-blue-500", roles: ["admin", "staff", "viewer"] },
      { title: "Profile", url: "/profile", icon: User, iconColor: "text-green-500", roles: ["admin", "staff", "viewer"] },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Member Directory", url: "/members", icon: Users, iconColor: "text-emerald-500", roles: ["admin", "staff", "viewer"] },
      { title: "User Management", url: "/admin/users", icon: Shield, iconColor: "text-indigo-500", roles: ["admin"] },
      { title: "Manage Staff", url: "/admin/staff", icon: Users, iconColor: "text-orange-500", roles: ["admin"] },
      { title: "Manage Departments", url: "/admin/departments", icon: Users, iconColor: "text-cyan-500", roles: ["admin", "staff"] },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Prayer Requests", url: "/admin/prayer-requests", icon: Heart, iconColor: "text-red-500", roles: ["admin", "staff"] },
      { title: "Albums", url: "/admin/albums", icon: Image, iconColor: "text-purple-500", roles: ["admin", "staff"] },
      { title: "Events", url: "/events", icon: Calendar, iconColor: "text-amber-500", roles: ["admin", "staff"] },
      { title: "Testimonies", url: "/testimony", icon: MessageSquare, iconColor: "text-rose-500", roles: ["admin", "staff"] },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Color Palette", url: "/admin/color-palette", icon: Palette, iconColor: "text-pink-500", roles: ["admin"] },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";
  const { role } = useUserRole();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();
        
        if (profile) {
          setUserName(profile.full_name);
        }
      }
    };
    fetchUserProfile();
  }, []);

  const filteredSections = adminMenuSections.map(section => ({
    ...section,
    items: section.items.filter(item => role && item.roles.includes(role))
  })).filter(section => section.items.length > 0);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gray-100 text-gray-900 font-semibold border-l-4 border-primary shadow-sm" 
      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar 
      variant="sidebar" 
      collapsible="icon" 
      className="border-r border-gray-200 bg-white shadow-sm"
    >
      <div className="p-3 flex justify-between items-center border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Admin Panel</p>
              {role && (
                <Badge variant="outline" className="text-xs mt-0.5 h-4 px-1 border-gray-300 text-gray-700 bg-gray-50">
                  {role}
                </Badge>
              )}
            </div>
          </div>
        )}
        <SidebarTrigger className="ml-auto text-gray-700 hover:bg-gray-100 hover:text-gray-900" />
      </div>

      <SidebarContent className="px-2 py-4 bg-white">
        {filteredSections.map((section, sectionIndex) => (
          <SidebarGroup key={section.label} className={sectionIndex > 0 ? "mt-6" : ""}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                {section.label}
              </SidebarGroupLabel>
            )}
            {isCollapsed && sectionIndex > 0 && (
              <Separator className="my-2 bg-gray-200" />
            )}

            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink to={item.url} end className={getNavCls}>
                        <div className="p-1.5 rounded-md bg-gray-50">
                          <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                        </div>
                        {!isCollapsed && (
                          <span className="font-medium text-sm">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-3 bg-white">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/15 text-primary font-semibold text-sm">
                  {userName ? getInitials(userName) : "AD"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userName || "Admin User"}
                </p>
                <p className="text-xs text-gray-600 capitalize">
                  {role || "User"}
                </p>
              </div>
            </div>
            <SidebarMenuButton 
              onClick={handleSignOut} 
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 h-9"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium text-sm">Sign Out</span>
            </SidebarMenuButton>
          </div>
        ) : (
          <div className="space-y-2">
            <Avatar className="h-9 w-9 mx-auto">
              <AvatarFallback className="bg-primary/15 text-primary font-semibold text-xs">
                {userName ? getInitials(userName) : "AD"}
              </AvatarFallback>
            </Avatar>
            <SidebarMenuButton 
              onClick={handleSignOut} 
              className="w-full justify-center text-red-600 hover:bg-red-50 h-9"
            >
              <LogOut className="h-4 w-4" />
            </SidebarMenuButton>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
