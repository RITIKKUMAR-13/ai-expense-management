import React, { createContext, useContext, useEffect, useState } from "react";
import { resolveThemePreference, THEME_STORAGE_KEY, type ThemePreference } from "./themePreference";

type Theme = ThemePreference;

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({ children, defaultTheme = "light", switchable = false }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    return resolveThemePreference(localStorage.getItem(THEME_STORAGE_KEY), defaultTheme);
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.dataset.theme = theme;
    if (switchable) localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, switchable]);

  const toggleTheme = switchable ? () => setTheme((current) => current === "light" ? "dark" : "light") : undefined;

  return <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
