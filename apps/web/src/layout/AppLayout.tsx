import { Outlet } from '@tanstack/react-router';

import { CookieConsent } from '@/components/CookieConsent';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Notifications } from '@/components/Notifications';
import { BreadcrumbBar } from '@/layout/BreadcrumbBar';
import { Footer } from '@/layout/Footer';
import { Header } from '@/layout/Header';
import { Sidebar } from '@/layout/Sidebar';

const AppLayout = () => (
  <div className="mx-auto flex h-screen w-full max-w-420 flex-col overflow-hidden bg-base-100 sm:border-x sm:border-border">
    <div className="flex min-h-0 flex-1">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <BreadcrumbBar />
        <main className="flex min-h-0 flex-1">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
    <Footer />
    <Notifications />
    <CookieConsent />
  </div>
);

export default AppLayout;
