import { PlusIcon } from "@heroicons/react/24/solid";
import { useRef, useState } from "react";

import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useProject } from "@/hooks/useProjects";
import { useRequiredParam } from "@/hooks/useRequiredParam";
import { RunsSection } from "@/pages/ProjectDetailPage/RunsTab";
import {
  type SectionHandle,
  SuitesSection,
} from "@/pages/ProjectDetailPage/SuitesTab";

type Tab = "suites" | "runs";

export const ProjectDetailPage = () => {
  const projectId = useRequiredParam("projectId");
  const [activeTab, setActiveTab] = useState<Tab>("suites");
  const suitesRef = useRef<SectionHandle>(null);
  const runsRef = useRef<SectionHandle>(null);
  const { data: project, isPending } = useProject(projectId);

  useBreadcrumbs([
    { label: "Dashboard", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…" },
  ]);

  if (isPending)
    return (
      <div className="w-full flex flex-col min-h-0">
        <div className="page-header flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold tracking-tight font-display mb-0.5">
              <span className="skeleton inline-block w-52 h-[0.75em] rounded align-middle" />
            </div>
            <p className="mt-0.5 text-sm">
              <span className="skeleton inline-block w-80 h-[0.7em] rounded" />
            </p>
          </div>
          <div className="btn btn-sm skeleton pointer-events-none w-24 shrink-0" />
        </div>
        <div className="flex gap-1.5 px-4 sm:px-6 lg:px-8 py-3 border-b border-border shrink-0">
          <div className="px-3 py-1.5 text-sm font-medium rounded-full skeleton w-28" />
          <div className="px-3 py-1.5 text-sm font-medium rounded-full skeleton w-24" />
        </div>
        <div className="page-content">
          <SkeletonGrid />
        </div>
      </div>
    );

  if (!project)
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <p className="text-error font-semibold mb-2">Project not found</p>
          <p className="text-base-content/60 text-sm mb-4">
            This project may have been deleted or does not exist.
          </p>
        </div>
      </div>
    );

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "suites", label: "Test Suites", count: project.suiteCount },
    { key: "runs", label: "Test Runs", count: project.runCount },
  ];

  const openCreate = () =>
    activeTab === "suites"
      ? suitesRef.current?.open()
      : runsRef.current?.open();

  return (
    <div className="w-full flex flex-col min-h-0">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">
            {project.name}
          </h1>
          <p className="mt-0.5 text-sm text-base-content/60">
            {project.description ??
              "Manage test suites and runs for this project"}
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm shrink-0"
          onClick={openCreate}
        >
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-white/35 text-black">
            <PlusIcon className="size-3" aria-hidden="true" />
          </span>
          {activeTab === "suites" ? "New Suite" : "New Run"}
        </button>
      </header>

      <div className="flex gap-1.5 px-4 sm:px-6 lg:px-8 py-3 border-b border-border shrink-0">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full cursor-pointer transition-colors border ${
              activeTab === key
                ? "bg-primary/15 text-primary font-semibold border-primary/25"
                : "text-base-content border-base-content/12 hover:text-base-content hover:bg-base-content/8"
            }`}
          >
            {label}
            {!!count && (
              <span className="badge badge-sm badge-ghost rounded-full">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <section className="page-content flex-1 overflow-y-auto min-h-0">
        {activeTab === "suites" ? (
          <SuitesSection ref={suitesRef} projectId={projectId} />
        ) : (
          <RunsSection ref={runsRef} projectId={projectId} />
        )}
      </section>
    </div>
  );
};
