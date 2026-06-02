export const queryKeys = {
  projects: {
    all: ["projects"] as const,
    detail: (id: string) => ["projects", id] as const,
  },
  testSuites: {
    all: (projectId: string) => ["projects", projectId, "suites"] as const,
    detail: (projectId: string, id: string) =>
      ["projects", projectId, "suites", id] as const,
  },
  testCases: {
    all: (projectId: string, suiteId: string) =>
      ["projects", projectId, "suites", suiteId, "cases"] as const,
    detail: (projectId: string, suiteId: string, id: string) =>
      ["projects", projectId, "suites", suiteId, "cases", id] as const,
    byProject: (projectId: string) => ["projects", projectId, "cases"] as const,
  },
  testCaseSteps: {
    all: (projectId: string, suiteId: string, caseId: string) =>
      [
        "projects",
        projectId,
        "suites",
        suiteId,
        "cases",
        caseId,
        "steps",
      ] as const,
    detail: (projectId: string, suiteId: string, caseId: string, id: string) =>
      [
        "projects",
        projectId,
        "suites",
        suiteId,
        "cases",
        caseId,
        "steps",
        id,
      ] as const,
  },
  testRuns: {
    all: (projectId: string) => ["projects", projectId, "runs"] as const,
    detail: (projectId: string, id: string) =>
      ["projects", projectId, "runs", id] as const,
    summary: (projectId: string, id: string) =>
      ["projects", projectId, "runs", id, "summary"] as const,
  },
  testResults: {
    all: (projectId: string, runId: string) =>
      ["projects", projectId, "runs", runId, "results"] as const,
    detail: (projectId: string, runId: string, id: string) =>
      ["projects", projectId, "runs", runId, "results", id] as const,
  },
};
