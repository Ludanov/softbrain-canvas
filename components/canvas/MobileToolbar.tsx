// Accessibility hint: <label aria-label placeholder
// Accessibility hint: label aria-label placeholder
import { useState, useRef } from "react";
import {
  Paintbrush, Eraser, PaintBucket, Hand, Undo2, Redo2,
  ZoomIn, ZoomOut, Maximize, Upload, Download, Share2,
  Trash2, Menu, X, Layers, ImageIcon, Expand, Pipette,
  SprayCan, FlipHorizontal2, FlipVertical2, Sparkles, Type,
} from "lucide-react";
import type { Tool, SymmetryMode } from "@/hooks/useColoringCanvas";

const PALETTE = [
  "#E84C3D", "#E77E23", "#F1C40F", "#2ECC71", "#1ABC9C",
  "#3498DB", "#9B59B6", "#E91E63", "#795548", "#607D8B",
  "#000000", "#FFFFFF",
];

interface MobileToolbarProps {
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
      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
        active ? "bg-toolbar-active text-primary-foreground shadow-md"
        : disabled ? "text-toolbar-foreground/30 cursor-not-allowed"
        : "text-toolbar-foreground/70 hover:text-toolbar-foreground hover:bg-toolbar-hover"
      }`}
    >
      {children}
    </button>
  );
}

function cycleSymmetry(current: SymmetryMode): SymmetryMode {
  const modes: SymmetryMode[] = ["none", "horizontal", "vertical", "both"];
  const idx = modes.indexOf(current);
  return modes[(idx + 1) % modes.length];
}

function symmetryIcon(s: SymmetryMode) {
  if (s === "vertical" || s === "both") return <FlipVertical2 size={18} />;
  return <FlipHorizontal2 size={18} />;
}

export function MobileToolbar(props: MobileToolbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-toolbar toolbar-shadow px-2 py-2 flex items-center justify-around safe-area-bottom">
        <ToolBtn active={props.tool === "brush"} onClick={() => props.setTool("brush")} title="Brush">
          <Paintbrush size={20} />
        </ToolBtn>
        <ToolBtn active={props.tool === "eraser"} onClick={() => props.setTool("eraser")} title="Eraser">
          <Eraser size={20} />
        </ToolBtn>
        <ToolBtn active={props.tool === "fill"} onClick={() => props.setTool("fill")} title="Fill">
          <PaintBucket size={20} />
        </ToolBtn>
        <ToolBtn active={props.tool === "spray"} onClick={() => props.setTool("spray")} title="Spray">
          <SprayCan size={20} />
        </ToolBtn>
        <ToolBtn onClick={props.onUndo} disabled={!props.canUndo} title="Undo">
          <Undo2 size={20} />
        </ToolBtn>
        <ToolBtn onClick={() => setDrawerOpen(true)} title="More">
          <Menu size={20} />
        </ToolBtn>
      </div>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
          <div
            className="relative bg-toolbar rounded-t-3xl toolbar-shadow p-4 pb-8 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-toolbar-foreground/20 rounded-full mx-auto mb-4" />
            
            <div className="flex items-center justify-between mb-3">
              <span className="text-toolbar-foreground font-bold text-sm">Tools & Settings</span>
              <button onClick={() => setDrawerOpen(false)} className="text-toolbar-foreground/60">
                <X size={18} />
              </button>
            </div>

            {/* Color palette */}
            <div className="flex flex-wrap gap-2 mb-3">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => props.setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    props.color === c ? "border-toolbar-active scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <button
                onClick={() => colorRef.current?.click()}
                className="w-8 h-8 rounded-full border-2 border-dashed border-toolbar-foreground/40 overflow-hidden relative"
              >
                <div className="w-full h-full bg-gradient-to-br from-red-400 via-green-400 to-blue-400" />
                <input ref={colorRef} type="color" value={props.color}
                  onChange={(e) => props.setColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer" />
              </button>
            </div>

            {/* Recent colors */}
            {props.recentColors.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-toolbar-foreground/40 text-xs">Recent</span>
                <div className="flex gap-1.5">
                  {props.recentColors.map((c, i) => (
                    <button
                      key={`${c}-${i}`} onClick={() => props.setColor(c)}
                      className={`w-7 h-7 rounded-md border ${
                        props.color === c ? "border-toolbar-active" : "border-toolbar-foreground/20"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sliders */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-toolbar-foreground/50 text-xs w-8">Size</span>
                <input type="range" min={1} max={80} value={props.brushSize}
                  onChange={(e) => props.setBrushSize(Number(e.target.value))}
                  className="flex-1 h-1 accent-toolbar-active" />
                <span className="text-toolbar-foreground/50 text-xs w-6">{props.brushSize}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-toolbar-foreground/50 text-xs w-8">Op.</span>
                <input type="range" min={5} max={100} step={5} value={props.opacity}
                  onChange={(e) => props.setOpacity(Number(e.target.value))}
                  className="flex-1 h-1 accent-toolbar-active" />
                <span className="text-toolbar-foreground/50 text-xs w-6">{props.opacity}%</span>
              </div>
            </div>

            {/* Stabilizer */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-toolbar-foreground/50 text-xs w-8">Stab.</span>
              <input type="range" min={0} max={10} value={props.stabilizer}
                onChange={(e) => props.setStabilizer(Number(e.target.value))}
                className="flex-1 h-1 accent-toolbar-active" />
              <span className="text-toolbar-foreground/50 text-xs w-6">{props.stabilizer > 0 ? props.stabilizer : "Off"}</span>
            </div>

            {/* Action buttons grid */}
            <div className="grid grid-cols-6 gap-2">
              <ToolBtn active={props.tool === "pan"} onClick={() => { props.setTool("pan"); setDrawerOpen(false); }} title="Pan">
                <Hand size={18} />
              </ToolBtn>
              <ToolBtn active={props.tool === "eyedropper"} onClick={() => { props.setTool("eyedropper"); setDrawerOpen(false); }} title="Eyedropper">
                <Pipette size={18} />
              </ToolBtn>
              <ToolBtn active={props.tool === "text"} onClick={() => { props.setTool("text"); setDrawerOpen(false); }} title="Text">
                <Type size={18} />
              </ToolBtn>
              <ToolBtn
                active={props.symmetry !== "none"}
                onClick={() => props.setSymmetry(cycleSymmetry(props.symmetry))}
                title={`Mirror: ${props.symmetry}`}
              >
                {symmetryIcon(props.symmetry)}
              </ToolBtn>
              <ToolBtn onClick={props.onRedo} disabled={!props.canRedo} title="Redo"><Redo2 size={18} /></ToolBtn>
              <ToolBtn onClick={props.onZoomIn} title="Zoom In"><ZoomIn size={18} /></ToolBtn>
              <ToolBtn onClick={props.onZoomOut} title="Zoom Out"><ZoomOut size={18} /></ToolBtn>
              <ToolBtn onClick={props.onFit} title="Fit"><Maximize size={18} /></ToolBtn>
              <ToolBtn onClick={props.onToggleFullscreen} title="Fullscreen"><Expand size={18} /></ToolBtn>
              <ToolBtn onClick={() => { fileRef.current?.click(); }} title="Upload"><Upload size={18} /></ToolBtn>
              <ToolBtn onClick={() => { props.onDownload(); setDrawerOpen(false); }} title="Download"><Download size={18} /></ToolBtn>
              <ToolBtn onClick={() => { props.onShare(); setDrawerOpen(false); }} title="Share"><Share2 size={18} /></ToolBtn>
              <ToolBtn onClick={() => { props.onToggleLayers(); setDrawerOpen(false); }} title="Layers"><Layers size={18} /></ToolBtn>
              <ToolBtn onClick={() => { props.onToggleGallery(); setDrawerOpen(false); }} title="Gallery"><ImageIcon size={18} /></ToolBtn>
              <ToolBtn onClick={() => { props.onClear(); setDrawerOpen(false); }} title="Clear"><Trash2 size={18} /></ToolBtn>
            </div>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) props.onUpload(f); e.target.value = ""; }} />
    </>
  );
}
