import { type ReactNode, useEffect, useState } from "react";

import { getCookie, setCookie } from "@/services/cookie";

import { ThemeContext } from "./themeContext";

const THEME_KEY = "app-theme";
const LIGHT = "emerald";
const DARK = "dim";

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
