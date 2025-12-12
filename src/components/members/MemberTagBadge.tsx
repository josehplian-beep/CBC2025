import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface MemberTagBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
  size?: "sm" | "default";
}

export const MemberTagBadge = ({ name, color, onRemove, size = "default" }: MemberTagBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={`${size === "sm" ? "text-xs px-1.5 py-0" : "px-2 py-0.5"} border-0`}
      style={{ backgroundColor: `${color}20`, color: color }}
    >
      {name}
      {onRemove && (
        <button onClick={onRemove} className="ml-1 hover:opacity-70">
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
};
