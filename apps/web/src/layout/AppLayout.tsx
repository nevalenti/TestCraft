import { Outlet } from '@tanstack/react-router';

import { CookieConsent } from '@/components/CookieConsent';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastStack } from '@/components/ToastStack';
import { BreadcrumbBar } from '@/layout/BreadcrumbBar';
import { Footer } from '@/layout/Footer';
import { Header } from '@/layout/Header';
import { Sidebar } from '@/layout/Sidebar';

export const AppLayout = () => (
  <div className="h-screen bg-base-300 sm:p-4">
    <div className="mx-auto flex size-full max-w-360 flex-col overflow-hidden bg-base-100 sm:rounded-xl sm:border sm:border-border sm:shadow-card">
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
    </div>
    <ToastStack />
    <CookieConsent />
  </div>
);
