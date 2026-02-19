import { Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";

interface TextSizeControlProps {
  scale: number;
  onChange: (scale: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const TextSizeControl = ({ scale, onChange, min = 0.8, max = 1.6, step = 0.1 }: TextSizeControlProps) => {
  const decrease = () => onChange(Math.max(min, +(scale - step).toFixed(2)));
  const increase = () => onChange(Math.min(max, +(scale + step).toFixed(2)));
  const percentage = Math.round(scale * 100);

  return (
    <div className="inline-flex items-center gap-0 rounded-full border border-border bg-card shadow-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={decrease}
        disabled={scale <= min}
        className="rounded-l-full rounded-r-none px-3 h-9 text-muted-foreground hover:text-foreground disabled:opacity-30"
        aria-label="Decrease text size"
      >
        <span className="text-sm font-semibold">A</span>
        <Minus className="w-3 h-3 ml-0.5" />
      </Button>
      <span className="text-xs font-medium text-muted-foreground min-w-[3.5rem] text-center border-x border-border px-2 h-9 flex items-center justify-center select-none">
        {percentage}%
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={increase}
        disabled={scale >= max}
        className="rounded-r-full rounded-l-none px-3 h-9 text-muted-foreground hover:text-foreground disabled:opacity-30"
        aria-label="Increase text size"
      >
        <span className="text-base font-bold">A</span>
        <Plus className="w-3 h-3 ml-0.5" />
      </Button>
    </div>
  );
};

export default TextSizeControl;
