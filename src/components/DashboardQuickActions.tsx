import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Image, MessageSquare, Users, BookOpen, UserPlus, Shield } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

export function DashboardQuickActions() {
  const { can, isAdministrator, isEditor, isStaff, isTeacher } = usePermissions();

  const quickActions = [
    { 
      label: "Manage Users", 
      icon: Shield, 
      href: "/admin/users", 
      color: "text-red-500",
      show: isAdministrator
    },
    { 
      label: "New Event", 
      icon: Calendar, 
      href: "/events", 
      color: "text-orange-500",
      show: can('manage_events')
    },
    { 
      label: "New Album", 
      icon: Image, 
      href: "/admin/albums", 
      color: "text-purple-500",
      show: can('manage_albums')
    },
    { 
      label: "New Testimony", 
      icon: MessageSquare, 
      href: "/testimony", 
      color: "text-pink-500",
      show: can('manage_testimonies')
    },
    { 
      label: "Manage Classes", 
      icon: BookOpen, 
      href: "/admin/school/classes", 
      color: "text-blue-500",
      show: isTeacher
    },
    { 
      label: "Take Attendance", 
      icon: UserPlus, 
      href: "/admin/school/attendance", 
      color: "text-green-500",
      show: isTeacher
    },
    { 
      label: "View Members", 
      icon: Users, 
      href: "/members", 
      color: "text-emerald-500",
      show: true 
    },
  ];

  const visibleActions = quickActions.filter(action => action.show);

  if (visibleActions.length === 0) return null;

  return (
    <Card className="overflow-hidden border-2 rounded-2xl shadow-lg animate-fade-in bg-gradient-to-br from-card to-secondary/20">
      <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
        <CardTitle className="flex items-center gap-2 text-2xl font-display">
          <Plus className="h-6 w-6 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-3">
          {visibleActions.map((action) => (
            <Button
              key={action.href}
              asChild
              variant="outline"
              className="h-auto py-4 px-4 justify-start gap-3 hover:shadow-lg hover:scale-105 hover:border-primary/50 transition-all duration-200 rounded-xl border-2"
            >
              <Link to={action.href}>
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <span className="font-medium text-base">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
