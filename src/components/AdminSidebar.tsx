import { NavLink } from "react-router-dom";
import { User, Image, Users, Palette, LayoutDashboard, LogOut } from "lucide-react";
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

const adminMenuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, iconColor: "text-blue-500" },
  { title: "Profile", url: "/profile", icon: User, iconColor: "text-green-500" },
  { title: "Member Directory", url: "/members", icon: Users, iconColor: "text-emerald-500" },
  { title: "Manage Albums", url: "/admin/albums", icon: Image, iconColor: "text-purple-500" },
  { title: "Manage Staff", url: "/admin/staff", icon: Users, iconColor: "text-orange-500" },
  { title: "Manage Departments", url: "/admin/departments", icon: Users, iconColor: "text-cyan-500" },
  { title: "Color Palette", url: "/admin/color-palette", icon: Palette, iconColor: "text-pink-500" },
];

export function AdminSidebar() {
  const { state, isMobile } = useSidebar();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";

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
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white font-bold text-base mb-2 px-2">
            Admin Panel
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {adminMenuItems.map((item) => (
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
