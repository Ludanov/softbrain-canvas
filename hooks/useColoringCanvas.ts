import { useRef, useState, useCallback, useEffect } from "react";

export type Tool = "brush" | "eraser" | "fill" | "pan" | "eyedropper" | "spray" | "text";

export type SymmetryMode = "none" | "horizontal" | "vertical" | "both";

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  canvas: HTMLCanvasElement;
}

interface HistoryEntry {
  layerData: Map<string, ImageData>;
  activeLayerId: string;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

let layerIdCounter = 0;
function nextLayerId() {
  return `layer-${++layerIdCounter}`;
}

const MAX_RECENT_COLORS = 8;

export function useColoringCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);

  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#E84C3D");
  const [brushSize, setBrushSize] = useState(8);
  const [opacity, setOpacity] = useState(100);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [symmetry, setSymmetry] = useState<SymmetryMode>("none");
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [stabilizer, setStabilizer] = useState(0); // 0 = off, 1-10 = strength
  const [textInput, setTextInput] = useState<{ x: number; y: number; screenX: number; screenY: number } | null>(null);
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const [fontStyle, setFontStyle] = useState<"normal" | "bold" | "italic" | "bold-italic">("normal");

  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false);
  const lastPanRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartRef = useRef<number | null>(null);
  const pinchScaleRef = useRef<number>(1);
  const activeTouchesRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const stabilizerBufferRef = useRef<{ x: number; y: number }[]>([]);
  const sprayIntervalRef = useRef<number | null>(null);
  const lastSprayPointRef = useRef<{ x: number; y: number } | null>(null);

  const canvasWidth = useRef(1200);
  const canvasHeight = useRef(900);
  const layersRef = useRef<Layer[]>([]);
  const activeLayerIdRef = useRef<string>("");

  // Keep refs in sync
  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);
  useEffect(() => {
    activeLayerIdRef.current = activeLayerId;
  }, [activeLayerId]);

  const trackColor = useCallback((c: string) => {
    setRecentColors(prev => {
      const filtered = prev.filter(rc => rc !== c);
      return [c, ...filtered].slice(0, MAX_RECENT_COLORS);
    });
  }, []);

  const getActiveCanvas = useCallback((): HTMLCanvasElement | null => {
    const layer = layersRef.current.find(l => l.id === activeLayerIdRef.current);
    return layer?.canvas ?? null;
  }, []);

  const compositeAll = useCallback(() => {
    const comp = compositeCanvasRef.current;
    if (!comp) return;
    const ctx = comp.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, comp.width, comp.height);
    for (const layer of layersRef.current) {
      if (layer.visible) {
        ctx.globalAlpha = layer.opacity / 100;
        ctx.drawImage(layer.canvas, 0, 0);
      }
    }
    ctx.globalAlpha = 1;
  }, []);

  const pushHistory = useCallback(() => {
    const dataMap = new Map<string, ImageData>();
    for (const layer of layersRef.current) {
      const lctx = layer.canvas.getContext("2d");
      if (lctx) {
        dataMap.set(layer.id, lctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height));
      }
    }
    const idx = historyIndexRef.current + 1;
    historyRef.current = historyRef.current.slice(0, idx);
    historyRef.current.push({ layerData: dataMap, activeLayerId: activeLayerIdRef.current });
    historyIndexRef.current = idx;
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
    compositeAll();
  }, [compositeAll]);

  const restoreHistory = useCallback((entry: HistoryEntry) => {
    for (const layer of layersRef.current) {
      const data = entry.layerData.get(layer.id);
      const lctx = layer.canvas.getContext("2d");
      if (lctx && data) {
        lctx.putImageData(data, 0, 0);
      }
    }
    compositeAll();
  }, [compositeAll]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    restoreHistory(historyRef.current[historyIndexRef.current]);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, [restoreHistory]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    restoreHistory(historyRef.current[historyIndexRef.current]);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, [restoreHistory]);

  const createLayer = useCallback((name?: string): Layer => {
    const id = nextLayerId();
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth.current;
    canvas.height = canvasHeight.current;
    // Set willReadFrequently for better performance with getImageData operations
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    return { id, name: name ?? `Layer ${layersRef.current.length + 1}`, visible: true, opacity: 100, canvas };
  }, []);

  const addLayer = useCallback(() => {
    const layer = createLayer();
    setLayers(prev => [...prev, layer]);
    setActiveLayerId(layer.id);
    setTimeout(() => pushHistory(), 0);
  }, [createLayer, pushHistory]);

  const removeLayer = useCallback((id: string) => {
    if (layersRef.current.length <= 1) return;
    setLayers(prev => {
      const next = prev.filter(l => l.id !== id);
      if (activeLayerIdRef.current === id) {
        setActiveLayerId(next[next.length - 1].id);
      }
      return next;
    });
    setTimeout(() => {
      compositeAll();
      pushHistory();
    }, 0);
  }, [compositeAll, pushHistory]);

  const toggleLayerVisibility = useCallback((id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
    setTimeout(() => compositeAll(), 0);
  }, [compositeAll]);

  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setLayers(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setTimeout(() => compositeAll(), 0);
  }, [compositeAll]);

  const renameLayer = useCallback((id: string, name: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, name } : l));
  }, []);

  const setLayerOpacity = useCallback((id: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity } : l));
    setTimeout(() => compositeAll(), 0);
  }, [compositeAll]);

  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const cx = (clientX - rect.left - rect.width / 2 - transform.x) / transform.scale + canvasWidth.current / 2;
      const cy = (clientY - rect.top - rect.height / 2 - transform.y) / transform.scale + canvasHeight.current / 2;
      return { x: cx, y: cy };
    },
    [transform]
  );

  // Get mirrored points based on symmetry mode
  const getMirroredPoints = useCallback(
    (pt: { x: number; y: number }): { x: number; y: number }[] => {
      const cx = canvasWidth.current / 2;
      const cy = canvasHeight.current / 2;
      const points = [pt];
      if (symmetry === "horizontal" || symmetry === "both") {
        points.push({ x: canvasWidth.current - pt.x, y: pt.y });
      }
      if (symmetry === "vertical" || symmetry === "both") {
        points.push({ x: pt.x, y: canvasHeight.current - pt.y });
      }
      if (symmetry === "both") {
        points.push({ x: canvasWidth.current - pt.x, y: canvasHeight.current - pt.y });
      }
      return points;
    },
    [symmetry]
  );

  const stabilizePoint = useCallback(
    (pt: { x: number; y: number }): { x: number; y: number } => {
      if (stabilizer === 0) return pt;
      const buffer = stabilizerBufferRef.current;
      buffer.push(pt);
      const windowSize = Math.min(stabilizer * 2 + 1, buffer.length);
      const recent = buffer.slice(-windowSize);
      const avgX = recent.reduce((s, p) => s + p.x, 0) / recent.length;
      const avgY = recent.reduce((s, p) => s + p.y, 0) / recent.length;
      return { x: avgX, y: avgY };
    },
    [stabilizer]
  );

  const drawLineRaw = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }, pressure: number, ctx: CanvasRenderingContext2D, currentTool: Tool) => {
      const size = brushSize * (0.5 + pressure * 0.8);
      ctx.save();
      if (currentTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.globalAlpha = 1;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = opacity / 100;
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    },
    [color, brushSize, opacity]
  );

  const drawLine = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }, pressure: number = 0.5) => {
      const canvas = getActiveCanvas();
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const currentTool = tool;
      const fromStable = stabilizePoint(from);
      const toStable = stabilizePoint(to);

      // Draw for each mirrored point
      const fromMirrors = getMirroredPoints(fromStable);
      const toMirrors = getMirroredPoints(toStable);

      for (let i = 0; i < fromMirrors.length; i++) {
        drawLineRaw(fromMirrors[i], toMirrors[i], pressure, ctx, currentTool);
      }

      compositeAll();
    },
    [tool, getActiveCanvas, compositeAll, getMirroredPoints, stabilizePoint, drawLineRaw]
  );

  const sprayPaint = useCallback(
    (pt: { x: number; y: number }) => {
      const canvas = getActiveCanvas();
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const density = Math.floor(brushSize * 1.5);
      const radius = brushSize / 2;

      const allPoints = getMirroredPoints(pt);

      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = opacity / 100;
      ctx.fillStyle = color;

      for (const center of allPoints) {
        for (let i = 0; i < density; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * radius;
          const x = center.x + Math.cos(angle) * r;
          const y = center.y + Math.sin(angle) * r;
          const dotSize = Math.random() * 2 + 0.5;
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
      compositeAll();
    },
    [color, brushSize, opacity, getActiveCanvas, compositeAll, getMirroredPoints]
  );

  const floodFill = useCallback(
    (startX: number, startY: number) => {
      const activeCanvas = getActiveCanvas();
      if (!activeCanvas) return;
      const activeCtx = activeCanvas.getContext("2d");
      if (!activeCtx) return;

      const w = activeCanvas.width;
      const h = activeCanvas.height;

      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = w;
      sampleCanvas.height = h;
      const sampleCtx = sampleCanvas.getContext("2d")!;
      const bg = bgCanvasRef.current;
      if (bg) sampleCtx.drawImage(bg, 0, 0);
      for (const layer of layersRef.current) {
        if (layer.visible) {
          sampleCtx.globalAlpha = layer.opacity / 100;
          sampleCtx.drawImage(layer.canvas, 0, 0);
        }
      }
      sampleCtx.globalAlpha = 1;

      const imageData = sampleCtx.getImageData(0, 0, w, h);
      const data = imageData.data;

      const sx = Math.round(startX);
      const sy = Math.round(startY);
      if (sx < 0 || sx >= w || sy < 0 || sy >= h) return;

      const startIdx = (sy * w + sx) * 4;
      const targetR = data[startIdx];
      const targetG = data[startIdx + 1];
      const targetB = data[startIdx + 2];
      const targetA = data[startIdx + 3];

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 1;
      tempCanvas.height = 1;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.fillStyle = color;
      tempCtx.globalAlpha = opacity / 100;
      tempCtx.fillRect(0, 0, 1, 1);
      const fillData = tempCtx.getImageData(0, 0, 1, 1).data;
      const fillR = fillData[0];
      const fillG = fillData[1];
      const fillB = fillData[2];
      const fillA = fillData[3];

      if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === fillA) return;

      const tolerance = 32;
      const match = (idx: number) =>
        Math.abs(data[idx] - targetR) <= tolerance &&
        Math.abs(data[idx + 1] - targetG) <= tolerance &&
        Math.abs(data[idx + 2] - targetB) <= tolerance &&
        Math.abs(data[idx + 3] - targetA) <= tolerance;

      const stack: [number, number][] = [[sx, sy]];
      const visited = new Uint8Array(w * h);

      while (stack.length > 0) {
        const [cx, cy] = stack.pop()!;
        const vi = cy * w + cx;
        if (visited[vi]) continue;
        visited[vi] = 1;
        const idx = vi * 4;
        if (!match(idx)) continue;
        data[idx] = fillR;
        data[idx + 1] = fillG;
        data[idx + 2] = fillB;
        data[idx + 3] = fillA;
        if (cx > 0) stack.push([cx - 1, cy]);
        if (cx < w - 1) stack.push([cx + 1, cy]);
        if (cy > 0) stack.push([cx, cy - 1]);
        if (cy < h - 1) stack.push([cx, cy + 1]);
      }

      const activeData = activeCtx.getImageData(0, 0, w, h);
      const ad = activeData.data;
      for (let i = 0; i < visited.length; i++) {
        if (visited[i]) {
          const idx = i * 4;
          ad[idx] = fillR;
          ad[idx + 1] = fillG;
          ad[idx + 2] = fillB;
          ad[idx + 3] = fillA;
        }
      }
      activeCtx.putImageData(activeData, 0, 0);
      compositeAll();
      pushHistory();
    },
    [color, opacity, pushHistory, getActiveCanvas, compositeAll]
  );

  const pickColor = useCallback(
    (px: number, py: number) => {
      const w = canvasWidth.current;
      const h = canvasHeight.current;
      const sx = Math.round(px);
      const sy = Math.round(py);
      if (sx < 0 || sx >= w || sy < 0 || sy >= h) return;

      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = w;
      sampleCanvas.height = h;
      const sampleCtx = sampleCanvas.getContext("2d")!;
      const bg = bgCanvasRef.current;
      if (bg) sampleCtx.drawImage(bg, 0, 0);
      for (const layer of layersRef.current) {
        if (layer.visible) {
          sampleCtx.globalAlpha = layer.opacity / 100;
          sampleCtx.drawImage(layer.canvas, 0, 0);
        }
      }
      sampleCtx.globalAlpha = 1;

      const pixel = sampleCtx.getImageData(sx, sy, 1, 1).data;
      const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;
      setColor(hex);
      trackColor(hex);
      setTool("brush");
    },
    [trackColor]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!getActiveCanvas()) return;

      if (e.pointerType === "touch") {
        activeTouchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activeTouchesRef.current.size >= 2) {
          isPanningRef.current = true;
          isDrawingRef.current = false;
          const touches = Array.from(activeTouchesRef.current.values());
          const dist = Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y);
          pinchStartRef.current = dist;
          pinchScaleRef.current = transform.scale;
          const midX = (touches[0].x + touches[1].x) / 2;
          const midY = (touches[0].y + touches[1].y) / 2;
          lastPanRef.current = { x: midX, y: midY };
          return;
        }
      }

      if (tool === "pan") {
        isPanningRef.current = true;
        lastPanRef.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      if (tool === "eyedropper") {
        const pt = getCanvasPoint(e.clientX, e.clientY);
        pickColor(pt.x, pt.y);
        return;
      }

      if (tool === "text") {
        const pt = getCanvasPoint(e.clientX, e.clientY);
        setTextInput({ x: pt.x, y: pt.y, screenX: e.clientX, screenY: e.clientY });
        return;
      }

      if (tool === "fill") {
        const pt = getCanvasPoint(e.clientX, e.clientY);
        trackColor(color);
        floodFill(pt.x, pt.y);
        return;
      }

      if (tool === "spray") {
        isDrawingRef.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        const pt = getCanvasPoint(e.clientX, e.clientY);
        lastSprayPointRef.current = pt;
        sprayPaint(pt);
        // Continuous spray
        sprayIntervalRef.current = window.setInterval(() => {
          if (lastSprayPointRef.current) {
            sprayPaint(lastSprayPointRef.current);
          }
        }, 50);
        return;
      }

      isDrawingRef.current = true;
      const pt = getCanvasPoint(e.clientX, e.clientY);
      lastPointRef.current = pt;
      stabilizerBufferRef.current = [pt];
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      trackColor(color);
      drawLine(pt, pt, e.pressure || 0.5);
    },
    [tool, transform, getCanvasPoint, floodFill, drawLine, getActiveCanvas, sprayPaint, trackColor, color, pickColor]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch") {
        activeTouchesRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activeTouchesRef.current.size >= 2 && isPanningRef.current) {
          const touches = Array.from(activeTouchesRef.current.values());
          const dist = Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y);
          const midX = (touches[0].x + touches[1].x) / 2;
          const midY = (touches[0].y + touches[1].y) / 2;
          if (pinchStartRef.current !== null) {
            const newScale = Math.max(0.1, Math.min(10, pinchScaleRef.current * (dist / pinchStartRef.current)));
            setTransform((t) => ({
              ...t,
              scale: newScale,
              x: t.x + (midX - (lastPanRef.current?.x ?? midX)),
              y: t.y + (midY - (lastPanRef.current?.y ?? midY)),
            }));
          }
          lastPanRef.current = { x: midX, y: midY };
          return;
        }
      }

      if (isPanningRef.current && lastPanRef.current) {
        const dx = e.clientX - lastPanRef.current.x;
        const dy = e.clientY - lastPanRef.current.y;
        setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
        lastPanRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (!isDrawingRef.current) return;

      if (tool === "spray") {
        const pt = getCanvasPoint(e.clientX, e.clientY);
        lastSprayPointRef.current = pt;
        return;
      }

      if (!lastPointRef.current) return;
      const pt = getCanvasPoint(e.clientX, e.clientY);
      drawLine(lastPointRef.current, pt, e.pressure || 0.5);
      lastPointRef.current = pt;
    },
    [getCanvasPoint, drawLine, tool]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch") {
        activeTouchesRef.current.delete(e.pointerId);
        if (activeTouchesRef.current.size < 2) {
          isPanningRef.current = false;
          pinchStartRef.current = null;
        }
      }

      if (isPanningRef.current && tool === "pan") {
        isPanningRef.current = false;
        lastPanRef.current = null;
        return;
      }

      if (sprayIntervalRef.current !== null) {
        clearInterval(sprayIntervalRef.current);
        sprayIntervalRef.current = null;
        lastSprayPointRef.current = null;
      }

      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        lastPointRef.current = null;
        stabilizerBufferRef.current = [];
        pushHistory();
      }
    },
    [tool, pushHistory]
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY * 0.002;
      setTransform((t) => ({
        ...t,
        scale: Math.max(0.1, Math.min(10, t.scale * (1 + delta))),
      }));
    } else {
      setTransform((t) => ({ ...t, x: t.x - e.deltaX, y: t.y - e.deltaY }));
    }
  }, []);

  const zoomIn = useCallback(() => {
    setTransform((t) => ({ ...t, scale: Math.min(10, t.scale * 1.25) }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((t) => ({ ...t, scale: Math.max(0.1, t.scale / 1.25) }));
  }, []);

  const fitToScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const scaleX = (rect.width - 40) / canvasWidth.current;
    const scaleY = (rect.height - 40) / canvasHeight.current;
    const scale = Math.min(scaleX, scaleY, 1);
    setTransform({ x: 0, y: 0, scale });
  }, []);

  const initLayers = useCallback(() => {
    const layer = createLayer("Layer 1");
    layersRef.current = [layer];
    activeLayerIdRef.current = layer.id;
    setLayers([layer]);
    setActiveLayerId(layer.id);
    return layer;
  }, [createLayer]);

  const loadImage = useCallback(
    (file: File) => {
      const img = new Image();
      img.onload = () => {
        const bgCanvas = bgCanvasRef.current;
        const comp = compositeCanvasRef.current;
        if (!bgCanvas || !comp) return;

        canvasWidth.current = img.width;
        canvasHeight.current = img.height;
        bgCanvas.width = img.width;
        bgCanvas.height = img.height;
        comp.width = img.width;
        comp.height = img.height;

        const bgCtx = bgCanvas.getContext("2d");
        if (bgCtx) {
          bgCtx.clearRect(0, 0, img.width, img.height);
          bgCtx.drawImage(img, 0, 0);
        }

        const layer = createLayer("Layer 1");
        layer.canvas.width = img.width;
        layer.canvas.height = img.height;
        layersRef.current = [layer];
        activeLayerIdRef.current = layer.id;
        setLayers([layer]);
        setActiveLayerId(layer.id);

        historyRef.current = [];
        historyIndexRef.current = -1;
        pushHistory();
        setHasImage(true);
        fitToScreen();
      };
      img.src = URL.createObjectURL(file);
    },
    [pushHistory, fitToScreen, createLayer]
  );

  const loadImageFromUrl = useCallback(
    (url: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const bgCanvas = bgCanvasRef.current;
        const comp = compositeCanvasRef.current;
        if (!bgCanvas || !comp) return;

        canvasWidth.current = img.width;
        canvasHeight.current = img.height;
        bgCanvas.width = img.width;
        bgCanvas.height = img.height;
        comp.width = img.width;
        comp.height = img.height;

        const bgCtx = bgCanvas.getContext("2d");
        if (bgCtx) {
          bgCtx.clearRect(0, 0, img.width, img.height);
          bgCtx.drawImage(img, 0, 0);
        }

        const layer = createLayer("Layer 1");
        layer.canvas.width = img.width;
        layer.canvas.height = img.height;
        layersRef.current = [layer];
        activeLayerIdRef.current = layer.id;
        setLayers([layer]);
        setActiveLayerId(layer.id);

        historyRef.current = [];
        historyIndexRef.current = -1;
        pushHistory();
        setHasImage(true);
        fitToScreen();
      };
      img.src = url;
    },
    [pushHistory, fitToScreen, createLayer]
  );

  const clearCanvas = useCallback(() => {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      compositeAll();
      pushHistory();
    }
  }, [pushHistory, getActiveCanvas, compositeAll]);

  const exportImage = useCallback(() => {
    const bg = bgCanvasRef.current;
    if (!bg) return null;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvasWidth.current;
    exportCanvas.height = canvasHeight.current;
    const ctx = exportCanvas.getContext("2d")!;
    ctx.drawImage(bg, 0, 0);
    for (const layer of layersRef.current) {
      if (layer.visible) {
        ctx.drawImage(layer.canvas, 0, 0);
      }
    }
    return exportCanvas;
  }, []);

  const downloadImage = useCallback(() => {
    const exportCanvas = exportImage();
    if (!exportCanvas) return;
    const link = document.createElement("a");
    link.download = "coloring-book.png";
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  }, [exportImage]);

  const shareImage = useCallback(async () => {
    const exportCanvas = exportImage();
    if (!exportCanvas) return;
    const blob = await new Promise<Blob | null>((resolve) => exportCanvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    if (navigator.share) {
      const file = new File([blob], "coloring-book.png", { type: "image/png" });
      try { await navigator.share({ files: [file], title: "My Coloring" }); } catch {}
    } else {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        alert("Image copied to clipboard!");
      } catch { downloadImage(); }
    }
  }, [exportImage, downloadImage]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  const placeText = useCallback(
    (text: string) => {
      if (!textInput || !text.trim()) { setTextInput(null); return; }
      const canvas = getActiveCanvas();
      if (!canvas) { setTextInput(null); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { setTextInput(null); return; }

      ctx.save();
      ctx.globalAlpha = opacity / 100;
      ctx.fillStyle = color;
      const weight = fontStyle.includes("bold") ? "bold" : "normal";
      const style = fontStyle.includes("italic") ? "italic" : "normal";
      ctx.font = `${style} ${weight} ${fontSize}px ${fontFamily}`;
      ctx.textBaseline = "top";

      const lines = text.split("\n");
      const lineHeight = fontSize * 1.3;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], textInput.x, textInput.y + i * lineHeight);
      }
      ctx.restore();

      compositeAll();
      pushHistory();
      trackColor(color);
      setTextInput(null);
    },
    [textInput, color, opacity, fontSize, fontFamily, fontStyle, getActiveCanvas, compositeAll, pushHistory, trackColor]
  );

  // Paste image from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) loadImage(file);
          return;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [loadImage]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Initialize
  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    const comp = compositeCanvasRef.current;
    if (!bgCanvas || !comp) return;

    bgCanvas.width = canvasWidth.current;
    bgCanvas.height = canvasHeight.current;
    comp.width = canvasWidth.current;
    comp.height = canvasHeight.current;

    const bgCtx = bgCanvas.getContext("2d");
    if (bgCtx) {
      bgCtx.fillStyle = "#ffffff";
      bgCtx.fillRect(0, 0, canvasWidth.current, canvasHeight.current);
    }

    const layer = initLayers();
    setTimeout(() => {
      pushHistory();
      fitToScreen();
    }, 0);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key === "b" && !e.ctrlKey && !e.metaKey) setTool("brush");
      if (e.key === "e" && !e.ctrlKey && !e.metaKey) setTool("eraser");
      if (e.key === "g" && !e.ctrlKey && !e.metaKey) setTool("fill");
      if (e.key === "h" && !e.ctrlKey && !e.metaKey) setTool("pan");
      if (e.key === "i" && !e.ctrlKey && !e.metaKey) setTool("eyedropper");
      if (e.key === "s" && !e.ctrlKey && !e.metaKey) setTool("spray");
      if (e.key === "t" && !e.ctrlKey && !e.metaKey) setTool("text");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  return {
    compositeCanvasRef,
    bgCanvasRef,
    containerRef,
    tool, setTool,
    color, setColor,
    brushSize, setBrushSize,
    opacity, setOpacity,
    transform,
    canUndo, canRedo,
    hasImage,
    undo, redo,
    zoomIn, zoomOut, fitToScreen,
    loadImage, loadImageFromUrl,
    clearCanvas, downloadImage, shareImage,
    handlePointerDown, handlePointerMove, handlePointerUp, handleWheel,
    // Layers
    layers, activeLayerId, setActiveLayerId,
    addLayer, removeLayer, toggleLayerVisibility, reorderLayers,
    renameLayer, setLayerOpacity,
    // Fullscreen
    isFullscreen, toggleFullscreen,
    // New features
    symmetry, setSymmetry,
    recentColors,
    stabilizer, setStabilizer,
    // Text tool
    textInput, setTextInput,
    fontSize, setFontSize,
    fontFamily, setFontFamily,
    fontStyle, setFontStyle,
    placeText,
  };
}
