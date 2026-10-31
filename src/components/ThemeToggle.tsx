import { motion } from "framer-motion";
import { Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { cn } from "@/lib/utils";

const modes = [
  {
    value: "light",
    label: "Day",
    hint: "Bright colors — easiest to read in daylight",
    Icon: Sun,
  },
  {
    value: "dark",
    label: "Night",
    hint: "Dark colors — gentler on the eyes at night",
    Icon: Moon,
  },
] as const;

type ThemeToggleProps = {
  variant?: "pill" | "row";
  className?: string;
};

export function ThemeToggle({
  variant = "pill",
  className,
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isNight = resolvedTheme === "dark";

  return (
    <TooltipProvider delayDuration={200}>
      <div
        role="group"
        aria-label="Page colors"
        className={cn(
          "flex items-center gap-1 rounded-full border border-border bg-secondary/70 p-1",
          variant === "row" && "w-full",
          className
        )}
      >
        {modes.map(({ value, label, hint, Icon }) => {
          const selected = value === "dark" ? isNight : !isNight;

          return (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-pressed={selected}
                  className={cn(
                    "relative flex items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium outline-none transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring",
                    variant === "row" && "flex-1 px-3",
                    selected
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="theme-toggle-highlight"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-full bg-primary"
                    />
                  )}
                  <Icon
                    className={cn(
                      "relative h-4 w-4 transition-transform duration-300",
                      selected && "scale-110"
                    )}
                  />
                  <span
                    className={cn(
                      "relative hidden lg:inline",
                      variant === "row" && "inline"
                    )}
                  >
                    {label}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {hint}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
