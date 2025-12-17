import { NavLink } from "react-router-dom";
import { User, Image, Users, Palette, LayoutDashboard, LogOut, MessageSquare, Calendar, Heart, Shield, Settings, FileText, GraduationCap, BookOpen, ClipboardList, BarChart3, Database, Trash2, UserCheck } from "lucide-react";
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
import { usePermissions } from "@/hooks/usePermissions";
import { getRoleDisplayName } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import type { Permission } from "@/lib/permissions";

interface MenuSection {
  label: string;
  items: MenuItem[];
}

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  iconColor: string;
  permissions: Permission[];
}

const adminMenuSections: MenuSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, iconColor: "text-blue-500", permissions: ['view_admin_panel'] },
      { title: "Profile", url: "/profile", icon: User, iconColor: "text-green-500", permissions: ['view_public_content'] },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Member Directory", url: "/members", icon: Users, iconColor: "text-emerald-500", permissions: ['view_member_directory'] },
      { title: "User & Role Management", url: "/admin/users", icon: Shield, iconColor: "text-indigo-500", permissions: ['manage_users', 'manage_roles'] },
      { title: "Manage Staff", url: "/admin/staff", icon: Users, iconColor: "text-orange-500", permissions: ['manage_staff'] },
      { title: "Manage Departments", url: "/admin/departments", icon: Users, iconColor: "text-cyan-500", permissions: ['manage_departments'] },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Prayer Requests", url: "/admin/prayer-requests", icon: Heart, iconColor: "text-red-500", permissions: ['manage_prayer_requests'] },
      { title: "Albums", url: "/admin/albums", icon: Image, iconColor: "text-purple-500", permissions: ['manage_albums'] },
      { title: "Events", url: "/admin/events", icon: Calendar, iconColor: "text-amber-500", permissions: ['manage_events'] },
      { title: "Messages", url: "/admin/messages", icon: MessageSquare, iconColor: "text-rose-500", permissions: ['manage_testimonies'] },
    ],
  },
  {
    label: "School Management",
    items: [
      { title: "School Dashboard", url: "/admin/school/dashboard", icon: LayoutDashboard, iconColor: "text-indigo-500", permissions: ['manage_students', 'manage_classes'] },
      { title: "Teachers", url: "/admin/school/teachers", icon: GraduationCap, iconColor: "text-violet-500", permissions: ['manage_students', 'manage_classes'] },
      { title: "Students", url: "/admin/school/students", icon: Users, iconColor: "text-sky-500", permissions: ['manage_students'] },
      { title: "Classes", url: "/admin/school/classes", icon: BookOpen, iconColor: "text-teal-500", permissions: ['manage_classes'] },
      { title: "Check-In Sessions", url: "/admin/school/checkin", icon: UserCheck, iconColor: "text-emerald-500", permissions: ['take_attendance'] },
      { title: "Attendance Dashboard", url: "/admin/school/attendance-dashboard", icon: BarChart3, iconColor: "text-fuchsia-500", permissions: ['take_attendance'] },
      { title: "Attendance Reports", url: "/admin/school/reports", icon: ClipboardList, iconColor: "text-amber-500", permissions: ['take_attendance'] },
    ],
  },
  {
    label: "System",
    items: [
      { title: "MySQL Sync", url: "/admin/mysql-sync", icon: Database, iconColor: "text-blue-400", permissions: ['manage_users'] },
      { title: "Delete MySQL Members", url: "/admin/delete-mysql-members", icon: Trash2, iconColor: "text-red-500", permissions: ['manage_users'] },
      { title: "Color Palette", url: "/admin/color-palette", icon: Palette, iconColor: "text-pink-500", permissions: ['manage_users'] },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";
  const { role, canAny } = usePermissions();
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
    items: section.items.filter(item => canAny(item.permissions))
  })).filter(section => section.items.length > 0);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-white/20 text-white font-semibold border-l-4 border-white shadow-sm" 
      : "text-slate-100 hover:bg-white/10 hover:text-white transition-all duration-200";

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
      className="border-r border-slate-700 shadow-lg"
      style={{ backgroundColor: 'hsl(210 45% 25%)' }}
    >
      <div className="p-3 flex justify-between items-center border-b border-slate-700">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Admin Panel</p>
              {role && (
                <Badge variant="outline" className="text-xs mt-0.5 h-4 px-1 border-slate-400 text-slate-200 bg-white/5">
                  {getRoleDisplayName(role)}
                </Badge>
              )}
            </div>
          </div>
        )}
        <SidebarTrigger className="ml-auto text-white hover:bg-white/10 hover:text-white" />
      </div>

      <SidebarContent className="px-2 py-4" style={{ backgroundColor: 'hsl(210 45% 25%)' }}>
        {filteredSections.map((section, sectionIndex) => (
          <SidebarGroup key={section.label} className={sectionIndex > 0 ? "mt-6" : ""}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-slate-200 uppercase tracking-wider px-3 mb-2">
                {section.label}
              </SidebarGroupLabel>
            )}
            {isCollapsed && sectionIndex > 0 && (
              <Separator className="my-2 bg-slate-700" />
            )}

            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink to={item.url} end className={getNavCls}>
                        <div className="p-1.5 rounded-md bg-white/5">
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

      <SidebarFooter className="border-t border-slate-700 p-3" style={{ backgroundColor: 'hsl(210 45% 25%)' }}>
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-white/10 text-white font-semibold text-sm">
                  {userName ? getInitials(userName) : "AD"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userName || "Admin User"}
                </p>
                <p className="text-xs text-slate-300 capitalize">
                  {role ? getRoleDisplayName(role) : "User"}
                </p>
              </div>
            </div>
            <SidebarMenuButton 
              onClick={handleSignOut} 
              className="w-full justify-start text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200 h-9"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium text-sm">Sign Out</span>
            </SidebarMenuButton>
          </div>
        ) : (
          <div className="space-y-2">
            <Avatar className="h-9 w-9 mx-auto">
              <AvatarFallback className="bg-white/10 text-white font-semibold text-xs">
                {userName ? getInitials(userName) : "AD"}
              </AvatarFallback>
            </Avatar>
            <SidebarMenuButton 
              onClick={handleSignOut} 
              className="w-full justify-center text-red-300 hover:bg-red-500/20 h-9"
            >
              <LogOut className="h-4 w-4" />
            </SidebarMenuButton>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
