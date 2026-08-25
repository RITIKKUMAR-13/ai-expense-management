import { describe, expect, it } from "vitest";
import { resolveThemePreference } from "../client/src/contexts/themePreference";

describe("Financial Studio theme preference", () => {
  it("uses a saved light or dark preference", () => {
    expect(resolveThemePreference("light", "dark")).toBe("light");
    expect(resolveThemePreference("dark", "light")).toBe("dark");
  });

  it("falls back safely when the saved preference is missing or invalid", () => {
    expect(resolveThemePreference(null, "light")).toBe("light");
    expect(resolveThemePreference("neon", "dark")).toBe("dark");
  });
});
