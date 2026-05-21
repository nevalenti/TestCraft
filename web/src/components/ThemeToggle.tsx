import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";

import { useTheme } from "@/contexts/ThemeContext";

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <label
      aria-label="Toggle theme"
      className="swap swap-rotate btn-sm btn-ghost"
    >
      <input
        type="checkbox"
        className="theme-controller"
        checked={isDark}
        onChange={toggleTheme}
      />
      <SunIcon className="swap-off size-5" aria-hidden="true" />
      <MoonIcon className="swap-on size-5" aria-hidden="true" />
    </label>
  );
};
