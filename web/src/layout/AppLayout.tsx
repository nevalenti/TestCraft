import { Navigate, Route, Routes } from "react-router";

import { CookieConsent } from "@/components/CookieConsent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Notifications } from "@/components/Notifications";
import { BreadcrumbBar } from "@/layout/BreadcrumbBar";
import { Footer } from "@/layout/Footer";
import { Header } from "@/layout/Header";
import { NotFound } from "@/pages/NotFound";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { TestCasePage } from "@/pages/TestCasePage";
import { TestRunPage } from "@/pages/TestRunPage";
import { TestSuitePage } from "@/pages/TestSuitePage";

const AppLayout = () => (
  <div className="mx-auto flex min-h-screen w-full max-w-360 flex-col bg-base-100 sm:border sm:border-accent/30 sm:overflow-hidden sm:rounded-box sm:min-h-[calc(100vh-2rem)] sm:my-4 app-shadow">
    <Header />
    <BreadcrumbBar />
    <main className="flex flex-1">
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
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
      </ErrorBoundary>
    </main>
    <Footer />
    <Notifications />
    <CookieConsent />
  </div>
);

export default AppLayout;
