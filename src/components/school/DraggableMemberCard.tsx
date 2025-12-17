import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, GraduationCap, UserCircle, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggableMemberCardProps {
  id?: string;
  name: string;
  imageUrl: string | null;
  type: "teacher" | "student" | "member";
  subtitle?: string;
  isDragging?: boolean;
}

const typeConfig = {
  teacher: {
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  student: {
    icon: GraduationCap,
    color: "text-green-600",
    bg: "bg-green-500/10",
  },
  member: {
    icon: UserCircle,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
  },
};

export function DraggableMemberCard({
  id,
  name,
  imageUrl,
  type,
  subtitle,
  isDragging: isDraggingProp,
}: DraggableMemberCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id || name,
    disabled: !id,
  });

  const config = typeConfig[type];
  const Icon = config.icon;
  const dragging = isDraggingProp || isDragging;

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "p-3 cursor-grab active:cursor-grabbing transition-all",
        dragging
          ? "opacity-90 shadow-lg scale-105 ring-2 ring-primary/50"
          : "hover:shadow-md hover:border-border"
      )}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
        <Avatar className="h-9 w-9">
          <AvatarImage src={imageUrl || undefined} />
          <AvatarFallback className={cn(config.bg, config.color)}>
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{name}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        <div className={cn("p-1.5 rounded", config.bg)}>
          <Icon className={cn("h-3.5 w-3.5", config.color)} />
        </div>
      </div>
    </Card>
  );
}
