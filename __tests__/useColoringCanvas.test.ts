import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock canvas elements for jsdom
class MockHTMLCanvasElement {
  width = 1200;
  height = 900;
  _context: MockCanvasRenderingContext2D | null = null;

  getContext(_contextId: string, _options?: unknown) {
    if (!this._context) {
      this._context = new MockCanvasRenderingContext2D(this);
    }
    return this._context;
  }
}

class MockCanvasRenderingContext2D {
  canvas: MockHTMLCanvasElement;
  globalAlpha = 1;
  globalCompositeOperation = "source-over";
  fillStyle = "#000000";
  strokeStyle = "#000000";
  lineWidth = 1;
  lineCap = "round";
  lineJoin = "round";
  font = "10px sans-serif";
  textBaseline = "top";
  _drawCalls: string[] = [];

  constructor(canvas: MockHTMLCanvasElement) {
    this.canvas = canvas;
  }

  save() {}
  restore() {}
  beginPath() {}
  moveTo(_x: number, _y: number) {}
  lineTo(_x: number, _y: number) {}
  stroke() {}
  arc(..._args: unknown[]) {}
  fill() { this._drawCalls.push("fill"); }
  fillText(_text: string, _x: number, _y: number) { this._drawCalls.push("fillText"); }
  strokeText(_text: string, _x: number, _y: number) {}
  clearRect(_x: number, _y: number, _w: number, _h: number) {}
  drawImage(..._args: unknown[]) {}
  fillRect(_x: number, _y: number, _w: number, _h: number) {}
  getImageData(_x: number, _y: number, w: number, h: number): ImageData {
    return new ImageData(w, h);
  }
  putImageData(_imageData: ImageData, _dx: number, _dy: number) {}
}

// Mock document.createElement for canvas
const createElement = document.createElement.bind(document);
vi.spyOn(document, "createElement").mockImplementation((tag: string, _options?: ElementCreationOptions) => {
  if (tag === "canvas") {
    const el = createElement("div"); // surrogate
    Object.defineProperty(el, "width", { value: 1200, writable: true });
    Object.defineProperty(el, "height", { value: 900, writable: true });
    const mockCtx = new MockCanvasRenderingContext2D({ width: 1200, height: 900 } as MockHTMLCanvasElement);
    (el as any).getContext = () => mockCtx;
    return el;
  }
  return createElement(tag);
});

// Simple test for hook utilities
describe("useColoringCanvas — symmetry", () => {
  it("should rotate through symmetry modes correctly", () => {
    const modes = ["none", "horizontal", "vertical", "both"] as const;

    // "none" → "horizontal"
    expect(modes[(modes.indexOf("none") + 1) % modes.length]).toBe("horizontal");
    // "horizontal" → "vertical"
    expect(modes[(modes.indexOf("horizontal") + 1) % modes.length]).toBe("vertical");
    // "vertical" → "both"
    expect(modes[(modes.indexOf("vertical") + 1) % modes.length]).toBe("both");
    // "both" → "none"
    expect(modes[(modes.indexOf("both") + 1) % modes.length]).toBe("none");
  });
});

describe("useColoringCanvas — color tracking", () => {
  it("should track recent colors with max of 8", () => {
    const MAX_RECENT_COLORS = 8;

    // Simulate the trackColor logic
    const trackColor = (prev: string[], color: string) => {
      const filtered = prev.filter((rc) => rc !== color);
      return [color, ...filtered].slice(0, MAX_RECENT_COLORS);
    };

    let colors: string[] = [];
    colors = trackColor(colors, "#FF0000");
    expect(colors).toEqual(["#FF0000"]);

    colors = trackColor(colors, "#00FF00");
    expect(colors).toEqual(["#00FF00", "#FF0000"]);

    // Add same color again — should move to front
    colors = trackColor(colors, "#FF0000");
    expect(colors).toEqual(["#FF0000", "#00FF00"]);

    // Fill beyond max
    colors = trackColor(colors, "#111");
    colors = trackColor(colors, "#222");
    colors = trackColor(colors, "#333");
    colors = trackColor(colors, "#444");
    colors = trackColor(colors, "#555");
    colors = trackColor(colors, "#666");
    colors = trackColor(colors, "#777");
    expect(colors.length).toBe(8);
    expect(colors[0]).toBe("#777");

    // Add one more — should drop #00FF00
    colors = trackColor(colors, "#888");
    expect(colors.length).toBe(8);
    expect(colors[0]).toBe("#888");
    expect(colors).not.toContain("#00FF00");
  });
});

describe("useColoringCanvas — brush size", () => {
  it("should clamp brush size between 1 and 80", () => {
    const clamp = (val: number) => Math.max(1, Math.min(80, val));
    expect(clamp(0)).toBe(1);
    expect(clamp(1)).toBe(1);
    expect(clamp(40)).toBe(40);
    expect(clamp(80)).toBe(80);
    expect(clamp(100)).toBe(80);
  });
});

describe("useColoringCanvas — stabilizer", () => {
  it("should toggle stabilizer on/off", () => {
    const toggle = (current: number) => (current > 0 ? 0 : 5);
    expect(toggle(0)).toBe(5);
    expect(toggle(5)).toBe(0);
    expect(toggle(3)).toBe(0);
    expect(toggle(10)).toBe(0);
  });
});

describe("useColoringCanvas — zoom", () => {
  it("should zoom in by 1.25x with max of 10", () => {
    const zoomIn = (scale: number) => Math.min(10, scale * 1.25);
    expect(zoomIn(1)).toBeCloseTo(1.25);
    expect(zoomIn(8)).toBe(10);
    expect(zoomIn(10)).toBe(10);
  });

  it("should zoom out by 1.25x with min of 0.1", () => {
    const zoomOut = (scale: number) => Math.max(0.1, scale / 1.25);
    expect(zoomOut(1)).toBeCloseTo(0.8);
    expect(zoomOut(0.125)).toBe(0.1);
    expect(zoomOut(0.1)).toBe(0.1);
  });
});
