import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ActivityFeedItemProps {
  id: string;
  title: string;
  created_at: string;
  type: string;
  icon: LucideIcon;
  link: string;
}

export function ActivityFeedItem({ title, created_at, type, icon: Icon, link }: ActivityFeedItemProps) {
  const typeColors: Record<string, string> = {
    album: "bg-primary/10 text-primary border-primary/20",
    event: "bg-accent/10 text-accent border-accent/20",
    testimonial: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <Link
      to={link}
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl transition-all duration-200",
        "hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5",
        "hover:shadow-md hover:scale-[1.01]",
        "border-2 border-transparent hover:border-primary/20",
        "group"
      )}
    >
      <div className={cn(
        "flex items-center justify-center h-12 w-12 rounded-xl",
        "bg-gradient-to-br from-primary/10 to-accent/10",
        "transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
      )}>
        <Icon className="h-6 w-6 text-primary" />
      </div>
      
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate leading-tight">
          {title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">
            {format(new Date(created_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
          <Badge 
            variant="outline" 
            className={cn("text-xs capitalize border-2 font-medium", typeColors[type] || "")}
          >
            {type}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
