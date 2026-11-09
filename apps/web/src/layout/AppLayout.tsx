import { Outlet } from "@tanstack/react-router";
import { useRef } from "react";

import { useFocusMainOnNavigation } from "@/hooks/useFocusMainOnNavigation";
import { BreadcrumbBar } from "@/layout/BreadcrumbBar";
import { CookieConsent } from "@/layout/CookieConsent";
import { Header } from "@/layout/Header";
import { ToastStack } from "@/layout/ToastStack";

export const AppLayout = () => {
  const mainRef = useRef<HTMLElement>(null);
  useFocusMainOnNavigation(mainRef);

  return (
    <div className="contour-background h-dvh bg-base-300 sm:p-4">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-(--z-skip-link) focus:rounded-lg focus:bg-base-100 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-card"
      >
        Skip to content
      </a>
      <CookieConsent />
      <div className="mx-auto flex size-full max-w-360 flex-col overflow-hidden bg-base-300 sm:rounded-xl sm:border sm:border-border sm:shadow-card">
        <Header />
        <BreadcrumbBar />
        <main
          id="main"
          ref={mainRef}
          tabIndex={-1}
          className="flex min-h-0 flex-1 focus:outline-none"
        >
          <Outlet />
        </main>
      </div>
      <ToastStack />
    </div>
  );
};
