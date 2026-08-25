/** Financial Studio theme preference contract, shared by the UI provider and unit tests. */
export type ThemePreference = "light" | "dark";

export const THEME_STORAGE_KEY = "spendwise-financial-studio-theme";

export function resolveThemePreference(storedTheme: string | null, fallbackTheme: ThemePreference): ThemePreference {
  return storedTheme === "light" || storedTheme === "dark" ? storedTheme : fallbackTheme;
}
