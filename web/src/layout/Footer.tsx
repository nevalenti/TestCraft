import { ThemeToggle } from "@/components/ThemeToggle";

export const Footer = () => {
  return (
    <footer className="footer footer-center text-base-content border-base-content/10 border-t p-4 sm:p-6 relative">
      <aside className="text-center text-sm">
        <p
          className="text-primary text-sm font-extrabold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          TestCraft
        </p>
        <p className="text-xs">Copyright &copy; 2026 - All rights reserved</p>
      </aside>
      <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 hidden lg:flex">
        <ThemeToggle />
      </div>
    </footer>
  );
};
