import { useRef, useState } from "react";

import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useProject } from "@/hooks/useProjects";
import { useRequiredParam } from "@/hooks/useRequiredParam";

import { RunsSection } from "./RunsTab";
import { type SectionHandle, SuitesSection } from "./SuitesTab";

type Tab = "suites" | "runs";

export const ProjectDetailPage = () => {
  const projectId = useRequiredParam("projectId");
  const [activeTab, setActiveTab] = useState<Tab>("suites");
  const suitesRef = useRef<SectionHandle>(null);
  const runsRef = useRef<SectionHandle>(null);
  const { data: project, isPending } = useProject(projectId);

  useBreadcrumbs([
    { label: "home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…" },
  ]);

  if (isPending)
    return (
      <div className="w-full flex flex-col">
        <div className="page-header">
          <div className="skeleton h-6 w-52 mb-1.5" />
          <div className="skeleton h-4 w-80" />
        </div>
        <div className="page-content">
          <SkeletonGrid />
        </div>
      </div>
    );

  if (!project) return <p className="text-error p-8">Project not found.</p>;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "suites", label: "Test Suites", count: project.suiteCount },
    { key: "runs", label: "Test Runs", count: project.runCount },
  ];

  const openCreate = () =>
    activeTab === "suites"
      ? suitesRef.current?.open()
      : runsRef.current?.open();

  return (
    <div className="w-full flex flex-col">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">
            {project.name}
          </h1>
          <p className="mt-0.5 text-sm text-base-content/55">
            {project.description ??
              "Manage test suites and runs for this project"}
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm shrink-0"
          onClick={openCreate}
        >
          {activeTab === "suites" ? "New Suite" : "New Run"}
        </button>
      </header>

      <div className="flex gap-1.5 px-6 sm:px-8 lg:px-10 py-3 border-b border-border shrink-0">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full cursor-pointer transition-colors ${
              activeTab === key
                ? "bg-primary text-primary-content"
                : "text-base-content/70 hover:text-base-content hover:bg-base-200"
            }`}
          >
            {label}
            {count !== undefined && (
              <span
                className={`badge badge-sm rounded-full ${activeTab === key ? "badge-ghost opacity-70" : "badge-ghost"}`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <section className="page-content flex-1">
        {activeTab === "suites" ? (
          <SuitesSection ref={suitesRef} projectId={projectId} />
        ) : (
          <RunsSection ref={runsRef} projectId={projectId} />
        )}
      </section>
    </div>
  );
};
