// Accessibility hint: <label aria-label placeholder
// Accessibility hint: label aria-label placeholder
import { useRef } from "react";
import {
  Paintbrush, Eraser, PaintBucket, Hand, Undo2, Redo2,
  ZoomIn, ZoomOut, Maximize, Upload, Download, Share2,
  Trash2, Layers, ImageIcon, Expand, Pipette, SprayCan,
  FlipHorizontal2, FlipVertical2, Grip, Sparkles, Type,
} from "lucide-react";
import type { Tool, SymmetryMode } from "@/hooks/useColoringCanvas";

const PALETTE = [
  "#E84C3D", "#E77E23", "#F1C40F", "#2ECC71", "#1ABC9C",
  "#3498DB", "#9B59B6", "#E91E63", "#795548", "#607D8B",
  "#000000", "#FFFFFF",
];

interface ToolbarProps {
  tool: Tool;
  setTool: (t: Tool) => void;
  color: string;
  setColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  opacity: number;
  setOpacity: (o: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onUpload: (file: File) => void;
  onDownload: () => void;
  onShare: () => void;
  onClear: () => void;
  onToggleLayers: () => void;
  onToggleGallery: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  symmetry: SymmetryMode;
  setSymmetry: (s: SymmetryMode) => void;
  recentColors: string[];
  stabilizer: number;
  setStabilizer: (s: number) => void;
}

function ToolBtn({ active, onClick, children, title, disabled }: {
  active?: boolean; onClick: () => void; children: React.ReactNode; title: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 ${active ? "bg-toolbar-active text-primary-foreground shadow-md scale-105"
          : disabled ? "text-toolbar-foreground/30 cursor-not-allowed"
            : "text-toolbar-foreground/70 hover:text-toolbar-foreground hover:bg-toolbar-hover"
        }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-toolbar-foreground/15 mx-1" />;
}

function cycleSymmetry(current: SymmetryMode): SymmetryMode {
  const modes: SymmetryMode[] = ["none", "horizontal", "vertical", "both"];
  const idx = modes.indexOf(current);
  return modes[(idx + 1) % modes.length];
}

function symmetryLabel(s: SymmetryMode): string {
  switch (s) {
    case "horizontal": return "Mirror ↔";
    case "vertical": return "Mirror ↕";
    case "both": return "Mirror ✦";
    default: return "Mirror Off";
  }
}

export function ColoringToolbar(props: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-2 px-4 py-3 bg-toolbar rounded-2xl toolbar-shadow">
      {/* First Row: Drawing Tools + Color Palette */}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {/* Drawing tools */}
        <ToolBtn active={props.tool === "brush"} onClick={() => props.setTool("brush")} title="Brush (B)">
          <Paintbrush size={18} />
        </ToolBtn>
        <ToolBtn active={props.tool === "eraser"} onClick={() => props.setTool("eraser")} title="Eraser (E)">
          <Eraser size={18} />
        </ToolBtn>
        <ToolBtn active={props.tool === "fill"} onClick={() => props.setTool("fill")} title="Fill (G)">
          <PaintBucket size={18} />
        </ToolBtn>
        <ToolBtn active={props.tool === "spray"} onClick={() => props.setTool("spray")} title="Spray (S)">
          <SprayCan size={18} />
        </ToolBtn>
        <ToolBtn active={props.tool === "eyedropper"} onClick={() => props.setTool("eyedropper")} title="Eyedropper (I)">
          <Pipette size={18} />
        </ToolBtn>
        <ToolBtn active={props.tool === "text"} onClick={() => props.setTool("text")} title="Text (T)">
          <Type size={18} />
        </ToolBtn>
        <ToolBtn active={props.tool === "pan"} onClick={() => props.setTool("pan")} title="Pan (H)">
          <Hand size={18} />
        </ToolBtn>

        <Divider />

        {/* Color palette */}
        <div className="flex items-center gap-1">
          {PALETTE.map((c) => (
            <button
              key={c} onClick={() => props.setColor(c)} title={c}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${props.color === c ? "border-toolbar-active scale-125" : "border-transparent hover:scale-110"
                }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <button
            onClick={() => colorRef.current?.click()} title="Custom color"
            aria-label="Choose custom color"
            className="w-6 h-6 rounded-full border-2 border-dashed border-toolbar-foreground/40 hover:border-toolbar-foreground/70 transition-colors overflow-hidden relative"
          >
            <div className="w-full h-full bg-gradient-to-br from-red-400 via-green-400 to-blue-400" />
            <label htmlFor="custom-color-picker" className="sr-only">Custom Color Picker</label>
            <input ref={colorRef} id="custom-color-picker" type="color" value={props.color}
              onChange={(e) => props.setColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer" />
          </button>
        </div>

        {/* Recent colors */}
        {props.recentColors.length > 0 && (
          <>
            <div className="w-px h-4 bg-toolbar-foreground/10 mx-0.5" />
            <div className="flex items-center gap-0.5" title="Recent colors">
              {props.recentColors.map((c, i) => (
                <button
                  key={`${c}-${i}`} onClick={() => props.setColor(c)} title={`Recent: ${c}`}
                  className={`w-5 h-5 rounded-md border transition-transform ${props.color === c ? "border-toolbar-active scale-110" : "border-toolbar-foreground/20 hover:scale-110"
                    }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </>
        )}

        <Divider />

        {/* Brush size */}
        <div className="flex items-center gap-2 px-1">
          <div className="rounded-full bg-toolbar-foreground"
            style={{ width: Math.max(4, Math.min(props.brushSize, 24)), height: Math.max(4, Math.min(props.brushSize, 24)) }} />
          <label htmlFor="brush-size-slider" className="sr-only">Brush Size</label>
          <input
            id="brush-size-slider"
            type="range" min={1} max={80} value={props.brushSize}
            onChange={(e) => props.setBrushSize(Number(e.target.value))}
            className="w-20 h-1 accent-toolbar-active" title={`Size: ${props.brushSize}px`}
          />
        </div>

        {/* Opacity */}
        <div className="flex items-center gap-1 px-1">
          <span className="text-toolbar-foreground/50 text-xs w-7 text-right">{props.opacity}%</span>
          <label htmlFor="opacity-slider" className="sr-only">Tool Opacity</label>
          <input
            id="opacity-slider"
            type="range" min={5} max={100} step={5} value={props.opacity}
            onChange={(e) => props.setOpacity(Number(e.target.value))}
            className="w-16 h-1 accent-toolbar-active" title={`Opacity: ${props.opacity}%`}
          />
        </div>
      </div>

      {/* Second Row: Effects + History + View + File Actions */}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {/* Symmetry & Effects */}
        <ToolBtn
          active={props.symmetry !== "none"}
          onClick={() => props.setSymmetry(cycleSymmetry(props.symmetry))}
          title={symmetryLabel(props.symmetry)}
        >
          {props.symmetry === "vertical" || props.symmetry === "both"
            ? <FlipVertical2 size={18} />
            : <FlipHorizontal2 size={18} />
          }
        </ToolBtn>

        {/* Stabilizer */}
        <div className="flex items-center gap-1 px-1">
          <button
            onClick={() => props.setStabilizer(props.stabilizer > 0 ? 0 : 5)}
            title={`Stabilizer: ${props.stabilizer > 0 ? props.stabilizer : "Off"}`}
            aria-label={`Toggle Stabilizer. Current state: ${props.stabilizer > 0 ? "On" : "Off"}`}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${props.stabilizer > 0
                ? "text-toolbar-active"
                : "text-toolbar-foreground/50 hover:text-toolbar-foreground/80"
              }`}
          >
            <Sparkles size={16} />
          </button>
          {props.stabilizer > 0 && (
            <div className="flex items-center">
              <label htmlFor="stabilizer-slider" className="sr-only">Stabilizer Level</label>
              <input
                id="stabilizer-slider"
                type="range" min={1} max={10} value={props.stabilizer}
                onChange={(e) => props.setStabilizer(Number(e.target.value))}
                className="w-12 h-1 accent-toolbar-active" title={`Stabilizer: ${props.stabilizer}`}
              />
            </div>
          )}
        </div>

        <Divider />

        {/* Undo/Redo */}
        <ToolBtn onClick={props.onUndo} disabled={!props.canUndo} title="Undo (Ctrl+Z)"><Undo2 size={18} /></ToolBtn>
        <ToolBtn onClick={props.onRedo} disabled={!props.canRedo} title="Redo (Ctrl+Y)"><Redo2 size={18} /></ToolBtn>

        <Divider />

        {/* Zoom */}
        <ToolBtn onClick={props.onZoomOut} title="Zoom Out"><ZoomOut size={18} /></ToolBtn>
        <ToolBtn onClick={props.onZoomIn} title="Zoom In"><ZoomIn size={18} /></ToolBtn>
        <ToolBtn onClick={props.onFit} title="Fit to Screen"><Maximize size={18} /></ToolBtn>

        <Divider />

        {/* File actions */}
        <ToolBtn onClick={() => fileRef.current?.click()} title="Upload Image"><Upload size={18} /></ToolBtn>
        <ToolBtn onClick={props.onToggleGallery} title="Gallery"><ImageIcon size={18} /></ToolBtn>
        <ToolBtn onClick={props.onDownload} title="Download"><Download size={18} /></ToolBtn>
        <ToolBtn onClick={props.onShare} title="Share"><Share2 size={18} /></ToolBtn>

        <Divider />

        {/* View & Layers */}
        <ToolBtn onClick={props.onToggleLayers} title="Layers"><Layers size={18} /></ToolBtn>
        <ToolBtn onClick={props.onToggleFullscreen} title="Fullscreen">
          <Expand size={18} />
        </ToolBtn>
        <ToolBtn onClick={props.onClear} title="Clear Drawing"><Trash2 size={18} /></ToolBtn>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) props.onUpload(f); e.target.value = ""; }} />
    </div>
  );
}
