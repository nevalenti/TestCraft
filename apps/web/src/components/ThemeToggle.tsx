import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";

import { useTheme } from "@/contexts/ThemeContext";

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost btn-sm btn-circle"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <MoonIcon className="size-5" aria-hidden="true" />
      ) : (
        <SunIcon className="size-5" aria-hidden="true" />
      )}
    </button>
  );
};
