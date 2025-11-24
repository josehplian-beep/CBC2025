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
    album: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    event: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    testimonial: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  };

  return (
    <Link
      to={link}
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl transition-all duration-200",
        "hover:bg-muted/50 hover:shadow-sm hover:scale-[1.01]",
        "border border-transparent hover:border-border/50",
        "group"
      )}
    >
      <div className={cn(
        "flex items-center justify-center h-10 w-10 rounded-lg",
        "bg-gradient-to-br from-muted to-muted/50",
        "transition-transform duration-300 group-hover:scale-110"
      )}>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate leading-tight">
          {title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground">
            {format(new Date(created_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
          <Badge variant="outline" className={cn("text-xs capitalize", typeColors[type] || "")}>
            {type}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
