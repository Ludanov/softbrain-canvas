// Accessibility hint: <label aria-label placeholder
// Accessibility hint: label aria-label placeholder
import { useState } from "react";
import { Eye, EyeOff, Plus, Trash2, ChevronUp, ChevronDown, Pencil, Check } from "lucide-react";
import type { Layer } from "@/hooks/useColoringCanvas";

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  addLayer: () => void;
  removeLayer: (id: string) => void;
  toggleVisibility: (id: string) => void;
  reorderLayers: (from: number, to: number) => void;
  renameLayer: (id: string, name: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
}

export function LayersPanel({
  layers,
  activeLayerId,
  setActiveLayerId,
  addLayer,
  removeLayer,
  toggleVisibility,
  reorderLayers,
  renameLayer,
  setLayerOpacity,
}: LayersPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const startRename = (layer: Layer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(layer.id);
    setEditName(layer.name);
  };

  const commitRename = () => {
    if (editingId && editName.trim()) {
      renameLayer(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col bg-toolbar rounded-2xl toolbar-shadow p-3 w-52 gap-2">
      <div className="flex items-center justify-between">
        <span className="text-toolbar-foreground text-xs font-bold uppercase tracking-wider">Layers</span>
        <button
          onClick={addLayer}
          className="w-6 h-6 flex items-center justify-center rounded-md text-toolbar-foreground/70 hover:text-toolbar-foreground hover:bg-toolbar-hover transition-colors"
          title="Add Layer"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {[...layers].reverse().map((layer, revIdx) => {
          const realIdx = layers.length - 1 - revIdx;
          const isActive = layer.id === activeLayerId;
          const isEditing = editingId === layer.id;
          return (
            <div key={layer.id} className="flex flex-col gap-1">
              <div
                onClick={() => setActiveLayerId(layer.id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${isActive
                    ? "bg-toolbar-active text-primary-foreground"
                    : "text-toolbar-foreground/70 hover:bg-toolbar-hover"
                  }`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}
                  className="shrink-0 opacity-70 hover:opacity-100"
                  title={layer.visible ? "Hide" : "Show"}
                >
                  {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                {isEditing ? (
                  <>
                    <label htmlFor={`rename-layer-${layer.id}`} className="sr-only">Rename Layer</label>
                    <input
                      id={`rename-layer-${layer.id}`}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => { if (e.key === "Enter") commitRename(); }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-transparent border-b border-current text-xs outline-none min-w-0"
                      autoFocus
                    />
                  </>
                ) : (
                  <span className="flex-1 truncate">{layer.name}</span>
                )}
                <div className="flex items-center gap-0.5 shrink-0">
                  {isEditing ? (
                    <button onClick={(e) => { e.stopPropagation(); commitRename(); }} className="opacity-70 hover:opacity-100" title="Confirm">
                      <Check size={10} />
                    </button>
                  ) : (
                    <button onClick={(e) => startRename(layer, e)} className="opacity-50 hover:opacity-100" title="Rename">
                      <Pencil size={10} />
                    </button>
                  )}
                  {realIdx < layers.length - 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); reorderLayers(realIdx, realIdx + 1); }}
                      className="opacity-50 hover:opacity-100" title="Move up"
                    >
                      <ChevronUp size={10} />
                    </button>
                  )}
                  {realIdx > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); reorderLayers(realIdx, realIdx - 1); }}
                      className="opacity-50 hover:opacity-100" title="Move down"
                    >
                      <ChevronDown size={10} />
                    </button>
                  )}
                  {layers.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                      className="opacity-50 hover:opacity-100" title="Delete layer"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              </div>
              {/* Opacity slider - shown for active layer */}
              {isActive && (
                <div className="flex items-center gap-1.5 px-2 pb-1">
                  <span className="text-toolbar-foreground/40 text-[10px] w-6">Op.</span>
                  <label htmlFor={`layer-opacity-${layer.id}`} className="sr-only">Layer Opacity</label>
                  <input
                    id={`layer-opacity-${layer.id}`}
                    type="range" min={0} max={100} value={layer.opacity}
                    onChange={(e) => setLayerOpacity(layer.id, Number(e.target.value))}
                    className="flex-1 h-1 accent-toolbar-active"
                  />
                  <span className="text-toolbar-foreground/40 text-[10px] w-7 text-right">{layer.opacity}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
