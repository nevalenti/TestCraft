import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";

import { useTheme } from "@/contexts/ThemeContext";

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {isDark ? (
        <SunIcon className="size-4" aria-hidden="true" />
      ) : (
        <MoonIcon className="size-4" aria-hidden="true" />
      )}
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
};
