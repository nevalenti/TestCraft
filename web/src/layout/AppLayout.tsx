import { Route, Routes } from "react-router";

import { CookieConsent } from "@/components/CookieConsent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Notifications } from "@/components/Notifications";
import { Footer } from "@/layout/Footer";
import { Header } from "@/layout/Header";
import { DashboardPage } from "@/pages/DashboardPage/DashboardPage";
import { NotFound } from "@/pages/NotFound";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage/ProjectDetailPage";
import { ProjectsPage } from "@/pages/ProjectsPage/ProjectsPage";
import { TestCasePage } from "@/pages/TestCasePage/TestCasePage";
import { TestRunPage } from "@/pages/TestRunPage/TestRunPage";
import { TestSuitePage } from "@/pages/TestSuitePage/TestSuitePage";

const AppLayout = () => (
  <div className="mx-auto flex h-screen w-full max-w-360 flex-col overflow-hidden bg-base-100 sm:border sm:border-border sm:rounded-box sm:h-[calc(100vh-2rem)] sm:my-4 app-shadow">
    <Header />
    <main className="flex flex-1 min-h-0">
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
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
