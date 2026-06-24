import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (className utility)", () => {
  it("should merge class names", () => {
    expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("should filter out falsy values", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c");
  });

  it("should handle conditional classes via object", () => {
    const isActive = true;
    expect(cn("base", isActive && "active", !isActive && "inactive")).toBe(
      "base active"
    );
  });

  it("should handle conditional classes via ternary", () => {
    const isActive = false;
    expect(cn("base", isActive ? "active" : "inactive")).toBe(
      "base inactive"
    );
  });

  it("should merge tailwind conflicting classes (Tailwind Merge)", () => {
    // twMerge resolves conflicts: the last bg- wins
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    expect(cn("text-sm text-lg", "text-base")).toBe("text-base");
    expect(cn("p-4 px-2", "py-8")).toBe("p-4 px-2 py-8");
  });

  it("should handle empty input", () => {
    expect(cn()).toBe("");
  });

  it("should handle single class", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("should trim whitespace", () => {
    expect(cn("  foo  ", "  bar  ")).toBe("foo bar");
  });
});
