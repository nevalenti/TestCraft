import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { getCookie, setCookie } from "@/services/cookie";

const THEME_KEY = "app-theme";
const LIGHT = "emerald";
const DARK = "dim";

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<string>(
    () => getCookie(THEME_KEY) ?? DARK,
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    setCookie(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === LIGHT ? DARK : LIGHT));

  return (
    <ThemeContext.Provider value={{ isDark: theme === DARK, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
};
