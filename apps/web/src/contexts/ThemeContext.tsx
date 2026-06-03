import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { getCookie, setCookie } from "@/lib/cookie";

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
};

const THEME_KEY = "app-theme";
const LIGHT = "emerald";
const DARK = "forest";

const resolveTheme = (): string => {
  const stored = getCookie(THEME_KEY);
  return stored === LIGHT || stored === DARK ? stored : LIGHT;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<string>(resolveTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    setCookie(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((theme) => (theme === LIGHT ? DARK : LIGHT));

  return (
    <ThemeContext.Provider value={{ isDark: theme === DARK, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
