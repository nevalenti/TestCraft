import { Outlet } from "@tanstack/react-router";

import { BreadcrumbBar } from "@/layout/BreadcrumbBar";
import { CookieConsent } from "@/layout/CookieConsent";
import { Header } from "@/layout/Header";
import { ToastStack } from "@/layout/ToastStack";

export const AppLayout = () => (
  <div className="contour-background h-screen bg-base-300 sm:p-4">
    <div className="mx-auto flex size-full max-w-360 flex-col overflow-hidden bg-base-300 sm:rounded-xl sm:border sm:border-border sm:shadow-card">
      <Header />
      <BreadcrumbBar />
      <main className="flex min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
    <ToastStack />
    <CookieConsent />
  </div>
);
