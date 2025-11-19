import { NavLink } from "react-router-dom";
import { User, Image, Users, Palette, LayoutDashboard, LogOut, MessageSquare, Calendar, Heart } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
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

const adminMenuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, iconColor: "text-blue-500", roles: ["admin", "staff", "viewer"] },
  { title: "Profile", url: "/profile", icon: User, iconColor: "text-green-500", roles: ["admin", "staff", "viewer"] },
  { title: "Member Directory", url: "/members", icon: Users, iconColor: "text-emerald-500", roles: ["admin", "staff", "viewer"] },
  { title: "Prayer Requests", url: "/admin/prayer-requests", icon: Heart, iconColor: "text-red-500", roles: ["admin", "staff"] },
  { title: "Manage Albums", url: "/admin/albums", icon: Image, iconColor: "text-purple-500", roles: ["admin", "staff"] },
  { title: "Manage Staff", url: "/admin/staff", icon: Users, iconColor: "text-orange-500", roles: ["admin"] },
  { title: "Manage Departments", url: "/admin/departments", icon: Users, iconColor: "text-cyan-500", roles: ["admin", "staff"] },
  { title: "Manage Events", url: "/events", icon: Calendar, iconColor: "text-amber-500", roles: ["admin", "staff"] },
  { title: "Manage Testimony", url: "/testimony", icon: MessageSquare, iconColor: "text-rose-500", roles: ["admin", "staff"] },
  { title: "Color Palette", url: "/admin/color-palette", icon: Palette, iconColor: "text-pink-500", roles: ["admin"] },
];

export function AdminSidebar() {
  const { state, isMobile } = useSidebar();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";
  const { role } = useUserRole();

  const filteredMenuItems = adminMenuItems.filter(item => 
    role && item.roles.includes(role)
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-semibold shadow-sm" 
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white transition-colors";

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="bg-slate-900 dark:bg-slate-950">
      <div className="p-2 flex justify-end bg-slate-900 dark:bg-slate-950">
        <SidebarTrigger />
      </div>
      <SidebarContent className="bg-slate-900 dark:bg-slate-950">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white font-bold text-base mb-2 px-2 flex items-center justify-between">
            <span>Admin Panel</span>
            {!isCollapsed && role && (
              <Badge variant="secondary" className="text-xs">
                {role}
              </Badge>
            )}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className={`h-5 w-5 flex-shrink-0 ${item.iconColor}`} />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              <SidebarMenuItem className="mt-4">
                <SidebarMenuButton 
                  onClick={handleSignOut} 
                  className="text-white hover:bg-destructive/90 hover:text-white transition-colors font-medium"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0 text-red-300" />
                  {!isCollapsed && <span>Sign Out</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
