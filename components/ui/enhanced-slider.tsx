// Accessibility hint: <label aria-label placeholder
// Accessibility hint: label aria-label placeholder
import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  className?: string;
  /** Format value for display in the input field */
  formatValue?: (value: number) => string;
  /** Parse input string back to number */
  parseValue?: (value: string) => number;
  /** Suffix shown after the input (e.g. "px", "%") */
  suffix?: string;
  id?: string;
}

const EnhancedSlider = ({
  value,
  onChange,
  min,
  max,
  step,
  disabled,
  className,
  formatValue,
  parseValue,
  suffix,
  id,
}: EnhancedSliderProps) => {
  const [inputValue, setInputValue] = React.useState(() =>
    formatValue ? formatValue(value) : String(value)
  );
  const [isEditing, setIsEditing] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Sync input when value changes externally
  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(formatValue ? formatValue(value) : String(value));
    }
  }, [value, isEditing, formatValue]);

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const snapToStep = (v: number) => {
    const snapped = Math.round((v - min) / step) * step + min;
    return Math.round(snapped * 1000) / 1000; // avoid float issues
  };

  const increment = () => {
    if (disabled) return;
    onChange(clamp(snapToStep(value + step)));
  };

  const decrement = () => {
    if (disabled) return;
    onChange(clamp(snapToStep(value - step)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const commitInput = () => {
    setIsEditing(false);
    const parsed = parseValue ? parseValue(inputValue) : parseFloat(inputValue);
    if (!isNaN(parsed)) {
      onChange(clamp(snapToStep(parsed)));
    } else {
      setInputValue(formatValue ? formatValue(value) : String(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      commitInput();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(formatValue ? formatValue(value) : String(value));
      (e.target as HTMLInputElement).blur();
    }
  };

  // Mouse wheel on the entire control
  const handleWheel = React.useCallback(
    (e: WheelEvent) => {
      if (disabled) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? step : -step;
      onChange(clamp(snapToStep(value + delta)));
    },
    [disabled, value, step, min, max, onChange]
  );

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  return (
    <div ref={containerRef} className={cn("flex items-center gap-1.5", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={decrement}
        disabled={disabled || value <= min}
        tabIndex={-1}
      >
        <Minus className="w-3 h-3" />
      </Button>

      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(clamp(snapToStep(v)))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="flex-1"
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={increment}
        disabled={disabled || value >= max}
        tabIndex={-1}
      >
        <Plus className="w-3 h-3" />
      </Button>

      <div className="relative shrink-0">
        <Input
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsEditing(true)}
          onBlur={commitInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="h-7 w-16 text-xs text-center font-mono px-1 py-0"
        />
        {suffix && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

export { EnhancedSlider };
