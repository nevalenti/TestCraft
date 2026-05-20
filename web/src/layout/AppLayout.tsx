import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";

import { CookieConsent } from "@/components/CookieConsent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Notifications } from "@/components/Notifications";
import { BreadcrumbBar } from "@/layout/BreadcrumbBar";
import { Header } from "@/layout/Header";
import { PageSkeleton } from "@/layout/PageSkeleton";

const ProjectsPage = lazy(() =>
  import("@/pages/ProjectsPage").then((m) => ({ default: m.ProjectsPage })),
);
const ProjectDetailPage = lazy(() =>
  import("@/pages/ProjectDetailPage").then((m) => ({
    default: m.ProjectDetailPage,
  })),
);
const TestSuitePage = lazy(() =>
  import("@/pages/TestSuitePage").then((m) => ({ default: m.TestSuitePage })),
);
const TestCasePage = lazy(() =>
  import("@/pages/TestCasePage").then((m) => ({ default: m.TestCasePage })),
);
const TestRunPage = lazy(() =>
  import("@/pages/TestRunPage").then((m) => ({ default: m.TestRunPage })),
);
const NotFound = lazy(() =>
  import("@/pages/NotFound").then((m) => ({ default: m.NotFound })),
);

const AppLayout = () => (
  <div className="mx-auto flex min-h-screen w-full max-w-360 flex-col bg-base-100 sm:border sm:border-border sm:overflow-hidden sm:rounded-box sm:min-h-[calc(100vh-2rem)] sm:my-4 app-shadow">
    <Header />
    <BreadcrumbBar />
    <main className="flex flex-1">
      <ErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route
              path="/projects/:projectId"
              element={<ProjectDetailPage />}
            />
            <Route
              path="/projects/:projectId/suites/:suiteId"
              element={<TestSuitePage />}
            />
            <Route
              path="/projects/:projectId/suites/:suiteId/cases/:caseId"
              element={<TestCasePage />}
            />
            <Route
              path="/projects/:projectId/runs/:runId"
              element={<TestRunPage />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </main>
    <Notifications />
    <CookieConsent />
  </div>
);

export default AppLayout;
