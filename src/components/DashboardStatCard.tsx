import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface DashboardStatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  link?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function DashboardStatCard({ title, value, icon: Icon, iconColor, link, trend }: DashboardStatCardProps) {
  const cardContent = (
    <Card className="relative overflow-hidden border-2 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30 animate-fade-in group bg-gradient-to-br from-card via-card to-secondary/20">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-5">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <div className={cn(
          "p-3 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-lg",
          "bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20"
        )}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="text-4xl font-bold text-foreground tabular-nums group-hover:text-primary transition-colors">
            {value.toLocaleString()}
          </div>
          {trend && (
            <div className={cn(
              "text-xs font-semibold px-3 py-1 rounded-full",
              trend.isPositive 
                ? "bg-primary/10 text-primary" 
                : "bg-destructive/10 text-destructive"
            )}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {link && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-primary transition-colors mt-3">
            <span>View details</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (link) {
    return (
      <Link to={link} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
