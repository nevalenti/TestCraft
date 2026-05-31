import { Outlet } from "@tanstack/react-router";

import { CookieConsent } from "@/components/CookieConsent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Notifications } from "@/components/Notifications";
import { BreadcrumbBar } from "@/layout/BreadcrumbBar";
import { Footer } from "@/layout/Footer";
import { Header } from "@/layout/Header";

const AppLayout = () => (
  <div className="mx-auto flex h-screen w-full max-w-360 flex-col overflow-hidden bg-base-100 sm:border-x sm:border-border">
    <Header />
    <BreadcrumbBar />
    <main className="flex flex-1 min-h-0">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </main>
    <Footer />
    <Notifications />
    <CookieConsent />
  </div>
);

export default AppLayout;
