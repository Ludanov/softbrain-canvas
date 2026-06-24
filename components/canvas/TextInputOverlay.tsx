import { useState, useRef, useEffect } from "react";
import { Bold, Italic } from "lucide-react";

const FONT_OPTIONS = [
  { label: "Sans", value: "sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Mono", value: "monospace" },
  { label: "Cursive", value: "cursive" },
  { label: "Nunito", value: "'Nunito', sans-serif" },
];

interface TextInputOverlayProps {
  screenX: number;
  screenY: number;
  color: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: "normal" | "bold" | "italic" | "bold-italic";
  onConfirm: (text: string) => void;
  onCancel: () => void;
  onFontSizeChange: (s: number) => void;
  onFontFamilyChange: (f: string) => void;
  onFontStyleChange: (s: "normal" | "bold" | "italic" | "bold-italic") => void;
}

export function TextInputOverlay({
  screenX, screenY, color, fontSize, fontFamily, fontStyle,
  onConfirm, onCancel, onFontSizeChange, onFontFamilyChange, onFontStyleChange,
}: TextInputOverlayProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onConfirm(text);
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  const toggleBold = () => {
    if (fontStyle === "bold") onFontStyleChange("normal");
    else if (fontStyle === "bold-italic") onFontStyleChange("italic");
    else if (fontStyle === "italic") onFontStyleChange("bold-italic");
    else onFontStyleChange("bold");
  };

  const toggleItalic = () => {
    if (fontStyle === "italic") onFontStyleChange("normal");
    else if (fontStyle === "bold-italic") onFontStyleChange("bold");
    else if (fontStyle === "bold") onFontStyleChange("bold-italic");
    else onFontStyleChange("italic");
  };

  const isBold = fontStyle === "bold" || fontStyle === "bold-italic";
  const isItalic = fontStyle === "italic" || fontStyle === "bold-italic";

  return (
    <div className="fixed inset-0 z-50" onClick={() => onConfirm(text)}>
      <div
        className="absolute flex flex-col gap-2"
        style={{ left: screenX, top: screenY }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Text controls bar */}
        <div className="flex items-center gap-1 bg-toolbar rounded-lg toolbar-shadow px-2 py-1">
          <select
            value={fontFamily}
            onChange={(e) => onFontFamilyChange(e.target.value)}
            className="bg-toolbar-hover text-toolbar-foreground text-xs rounded px-1.5 py-1 border-none outline-none"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <input
            type="number" min={8} max={200} value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-14 bg-toolbar-hover text-toolbar-foreground text-xs rounded px-1.5 py-1 border-none outline-none text-center"
          />
          <button
            onClick={toggleBold}
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
              isBold ? "bg-toolbar-active text-primary-foreground" : "text-toolbar-foreground/60 hover:text-toolbar-foreground"
            }`}
          >
            <Bold size={14} />
          </button>
          <button
            onClick={toggleItalic}
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
              isItalic ? "bg-toolbar-active text-primary-foreground" : "text-toolbar-foreground/60 hover:text-toolbar-foreground"
            }`}
          >
            <Italic size={14} />
          </button>
        </div>

        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type here..."
          rows={1}
          className="bg-transparent border-2 border-dashed border-toolbar-active/50 rounded px-2 py-1 outline-none resize-none min-w-[120px]"
          style={{
            color,
            fontSize: `${fontSize}px`,
            fontFamily,
            fontWeight: isBold ? "bold" : "normal",
            fontStyle: isItalic ? "italic" : "normal",
            lineHeight: 1.3,
          }}
        />
        <p className="text-toolbar-foreground/40 text-[10px] bg-toolbar rounded px-2 py-0.5 w-fit toolbar-shadow">
          Enter to confirm · Shift+Enter for newline · Esc to cancel
        </p>
      </div>
    </div>
  );
}
