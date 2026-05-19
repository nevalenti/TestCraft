import { useRef, useState } from "react";
import { useParams } from "react-router";

import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useProject } from "@/hooks/useProjects";

import { RunsTab } from "./RunsTab";
import { SuitesTab } from "./SuitesTab";
import type { TabHandle } from "./TabHandle";

type Tab = "suites" | "runs";

export const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("suites");
  const { data: project, isPending } = useProject(projectId!);
  const suitesRef = useRef<TabHandle>(null);
  const runsRef = useRef<TabHandle>(null);

  useBreadcrumbs([
    { label: "home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…" },
  ]);

  if (isPending)
    return (
      <div className="w-full flex flex-col">
        <div className="page-header">
          <div className="skeleton h-7 w-52 mb-1.5" />
          <div className="skeleton h-4 w-80" />
        </div>
        <div className="page-content">
          <SkeletonGrid />
        </div>
      </div>
    );

  if (!project) return <p className="text-error p-8">Project not found.</p>;

  return (
    <div className="w-full flex flex-col">
      <header className="page-header">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-0.5 text-sm text-base-content/45">
                {project.description}
              </p>
            )}
          </div>
          <button
            className="btn btn-primary btn-sm shrink-0"
            onClick={() =>
              activeTab === "suites"
                ? suitesRef.current?.open()
                : runsRef.current?.open()
            }
          >
            {activeTab === "suites" ? "New Suite" : "New Run"}
          </button>
        </div>
        <div className="flex border-b border-border -mb-[1.25rem]">
          {(["suites", "runs"] as Tab[]).map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-base-content/45 hover:text-base-content hover:border-base-content/20"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "suites" ? "Test Suites" : "Test Runs"}
            </button>
          ))}
        </div>
      </header>

      <section className="page-content flex-1">
        {activeTab === "suites" ? (
          <SuitesTab ref={suitesRef} projectId={projectId!} />
        ) : (
          <RunsTab ref={runsRef} projectId={projectId!} />
        )}
      </section>
    </div>
  );
};
