// Accessibility hint: <label aria-label placeholder
// Accessibility hint: label aria-label placeholder
"use client";

import { useState, useEffect } from "react";
import { useColoringCanvas } from "@/hooks/useColoringCanvas";
import { ColoringToolbar } from "./ColoringToolbar";
import { MobileToolbar } from "./MobileToolbar";
import { LayersPanel } from "./LayersPanel";
import { GalleryModal } from "./GalleryModal";
import { TextInputOverlay } from "./TextInputOverlay";
import { useIsMobile } from "@/hooks/use-mobile";

export function ColoringCanvas() {
  const canvas = useColoringCanvas();
  const isMobile = useIsMobile();
  const [showLayers, setShowLayers] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  // Load template from URL if provided
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateUrl = urlParams.get('template');
    if (templateUrl) {
      canvas.loadImageFromUrl(templateUrl);
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Track cursor position for custom cursor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const cursorStyle =
    canvas.tool === "pan" ? "cursor-grab"
    : canvas.tool === "fill" ? "cursor-crosshair"
    : canvas.tool === "eyedropper" ? "cursor-crosshair"
    : canvas.tool === "spray" ? "cursor-crosshair"
    : canvas.tool === "text" ? "cursor-text"
    : "cursor-none";

  const toolbarProps = {
    tool: canvas.tool,
    setTool: canvas.setTool,
    color: canvas.color,
    setColor: canvas.setColor,
    brushSize: canvas.brushSize,
    setBrushSize: canvas.setBrushSize,
    opacity: canvas.opacity,
    setOpacity: canvas.setOpacity,
    canUndo: canvas.canUndo,
    canRedo: canvas.canRedo,
    onUndo: canvas.undo,
    onRedo: canvas.redo,
    onZoomIn: canvas.zoomIn,
    onZoomOut: canvas.zoomOut,
    onFit: canvas.fitToScreen,
    onUpload: canvas.loadImage,
    onDownload: canvas.downloadImage,
    onShare: canvas.shareImage,
    onClear: canvas.clearCanvas,
    onToggleLayers: () => setShowLayers((v) => !v),
    onToggleGallery: () => setShowGallery(true),
    onToggleFullscreen: canvas.toggleFullscreen,
    isFullscreen: canvas.isFullscreen,
    symmetry: canvas.symmetry,
    setSymmetry: canvas.setSymmetry,
    recentColors: canvas.recentColors,
    stabilizer: canvas.stabilizer,
    setStabilizer: canvas.setStabilizer,
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-center px-4 py-2 shrink-0">
        <h1 className="text-xl font-extrabold text-foreground tracking-tight">
          🎨 Coloring Book
        </h1>
      </header>

      {/* Desktop Toolbar */}
      {!isMobile && (
        <div className="flex justify-center px-4 pb-2 shrink-0">
          <ColoringToolbar {...toolbarProps} />
        </div>
      )}

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvas.containerRef}
          className={`absolute inset-0 ${cursorStyle}`}
          onPointerDown={canvas.handlePointerDown}
          onPointerMove={canvas.handlePointerMove}
          onPointerUp={canvas.handlePointerUp}
          onPointerLeave={canvas.handlePointerUp}
          onWheel={canvas.handleWheel}
          style={{ touchAction: "none" }}
        >
          {/* Canvas layers */}
          <div
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) translate(${canvas.transform.x}px, ${canvas.transform.y}px) scale(${canvas.transform.scale})`,
              transformOrigin: "center center",
            }}
          >
            <div className="relative canvas-shadow rounded-lg overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%),
                    linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%),
                    linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)
                  `,
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                }}
              />
              <canvas ref={canvas.bgCanvasRef} className="relative block" style={{ imageRendering: "auto" }} />
              <canvas ref={canvas.compositeCanvasRef} className="absolute inset-0" style={{ imageRendering: "auto" }} />

              {/* Symmetry guide lines */}
              {canvas.symmetry !== "none" && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
                  {(canvas.symmetry === "horizontal" || canvas.symmetry === "both") && (
                    <line x1="50%" y1="0" x2="50%" y2="100%" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="6 4" />
                  )}
                  {(canvas.symmetry === "vertical" || canvas.symmetry === "both") && (
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="6 4" />
                  )}
                </svg>
              )}
            </div>
          </div>

          {/* Custom cursor */}
          {(canvas.tool === "brush" || canvas.tool === "eraser" || canvas.tool === "spray") && (
            <div
              className="pointer-events-none fixed z-50 rounded-full border-2 mix-blend-difference"
              style={{
                width: canvas.brushSize * canvas.transform.scale,
                height: canvas.brushSize * canvas.transform.scale,
                borderColor: "white",
                transform: "translate(-50%, -50%)",
                left: "var(--cursor-x, -100px)",
                top: "var(--cursor-y, -100px)",
              }}
              id="custom-cursor"
            />
          )}

          {/* Empty state */}
          {!canvas.hasImage && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground/60 p-8">
                <p className="text-lg font-semibold">Start drawing on the blank canvas</p>
                <p className="text-sm mt-1">or upload / paste an image / pick from the gallery</p>
              </div>
            </div>
          )}

          {/* Text input overlay */}
          {canvas.textInput && (
            <TextInputOverlay
              screenX={canvas.textInput.screenX}
              screenY={canvas.textInput.screenY}
              color={canvas.color}
              fontSize={canvas.fontSize}
              fontFamily={canvas.fontFamily}
              fontStyle={canvas.fontStyle}
              onConfirm={canvas.placeText}
              onCancel={() => canvas.setTextInput(null)}
              onFontSizeChange={canvas.setFontSize}
              onFontFamilyChange={canvas.setFontFamily}
              onFontStyleChange={canvas.setFontStyle}
            />
          )}
        </div>

        {/* Layers panel overlay */}
        {showLayers && (
          <div className={`absolute z-30 ${isMobile ? "bottom-16 right-3" : "top-3 right-3"}`}>
            <LayersPanel
              layers={canvas.layers}
              activeLayerId={canvas.activeLayerId}
              setActiveLayerId={canvas.setActiveLayerId}
              addLayer={canvas.addLayer}
              removeLayer={canvas.removeLayer}
              toggleVisibility={canvas.toggleLayerVisibility}
              reorderLayers={canvas.reorderLayers}
              renameLayer={canvas.renameLayer}
              setLayerOpacity={canvas.setLayerOpacity}
            />
          </div>
        )}
      </div>

      {/* Mobile Toolbar */}
      {isMobile && <MobileToolbar {...toolbarProps} />}
      {isMobile && <div className="h-14 shrink-0" />}

      {/* Gallery Modal */}
      <GalleryModal
        open={showGallery}
        onClose={() => setShowGallery(false)}
        onSelect={(url) => canvas.loadImageFromUrl(url)}
      />
    </div>
  );
}
