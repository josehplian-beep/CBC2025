import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Image, MessageSquare, Users } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export function DashboardQuickActions() {
  const { role } = useUserRole();
  const isAdminOrStaff = role === "admin" || role === "staff";

  const quickActions = [
    { 
      label: "New Event", 
      icon: Calendar, 
      href: "/events", 
      color: "text-orange-500",
      show: isAdminOrStaff 
    },
    { 
      label: "New Album", 
      icon: Image, 
      href: "/admin/albums", 
      color: "text-purple-500",
      show: isAdminOrStaff 
    },
    { 
      label: "New Testimony", 
      icon: MessageSquare, 
      href: "/testimony", 
      color: "text-pink-500",
      show: isAdminOrStaff 
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
    <Card className="overflow-hidden shadow-lg animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleActions.map((action) => (
            <Button
              key={action.href}
              asChild
              variant="outline"
              className="h-auto py-4 px-4 justify-start gap-3 hover:shadow-md hover:scale-105 transition-all duration-200"
            >
              <Link to={action.href}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
                <span className="font-medium">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
