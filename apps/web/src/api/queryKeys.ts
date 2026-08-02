export const queryKeys = {
  account: {
    avatarUrl: ['account', 'avatar'] as const,
  },
  projects: {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
  },
  labels: {
    all: (projectId: string) => ['projects', projectId, 'labels'] as const,
  },
  testPlans: {
    all: (projectId: string) => ['projects', projectId, 'plans'] as const,
    detail: (projectId: string, planId: string) =>
      ['projects', projectId, 'plans', planId] as const,
    cases: (projectId: string, planId: string) =>
      ['projects', projectId, 'plans', planId, 'cases'] as const,
  },
  analytics: {
    trend: (projectId: string, limit: number) =>
      ['projects', projectId, 'analytics', 'trend', limit] as const,
    suiteBreakdown: (projectId: string, runId: string) =>
      ['projects', projectId, 'analytics', 'suite-breakdown', runId] as const,
    flakyTests: (projectId: string, minRuns: number) =>
      ['projects', projectId, 'analytics', 'flaky', minRuns] as const,
    runComparison: (projectId: string, runAId: string, runBId: string) =>
      ['projects', projectId, 'analytics', 'compare', runAId, runBId] as const,
  },
  apiTokens: {
    all: (projectId: string) => ['projects', projectId, 'tokens'] as const,
  },
  projectMembers: {
    all: (projectId: string) => ['projects', projectId, 'members'] as const,
  },
  attachments: {
    all: (projectId: string, runId: string, resultId: string) =>
      [
        'projects',
        projectId,
        'runs',
        runId,
        'results',
        resultId,
        'attachments',
      ] as const,
  },
  shareTokens: {
    all: (projectId: string, runId: string) =>
      ['projects', projectId, 'runs', runId, 'share'] as const,
    byToken: (token: string) => ['share', token] as const,
  },
  notifications: {
    webhooks: (projectId: string) =>
      ['projects', projectId, 'notifications', 'webhooks'] as const,
    emails: (projectId: string) =>
      ['projects', projectId, 'notifications', 'emails'] as const,
  },
  testSuites: {
    all: (projectId: string) => ['projects', projectId, 'suites'] as const,
    detail: (projectId: string, id: string) =>
      ['projects', projectId, 'suites', id] as const,
  },
  testCases: {
    all: (projectId: string, suiteId: string) =>
      ['projects', projectId, 'suites', suiteId, 'cases'] as const,
    detail: (projectId: string, suiteId: string, id: string) =>
      ['projects', projectId, 'suites', suiteId, 'cases', id] as const,
    byProject: (projectId: string) => ['projects', projectId, 'cases'] as const,
  },
  testCaseSteps: {
    all: (projectId: string, suiteId: string, caseId: string) =>
      [
        'projects',
        projectId,
        'suites',
        suiteId,
        'cases',
        caseId,
        'steps',
      ] as const,
    detail: (projectId: string, suiteId: string, caseId: string, id: string) =>
      [
        'projects',
        projectId,
        'suites',
        suiteId,
        'cases',
        caseId,
        'steps',
        id,
      ] as const,
  },
  testRuns: {
    all: (projectId: string) => ['projects', projectId, 'runs'] as const,
    detail: (projectId: string, id: string) =>
      ['projects', projectId, 'runs', id] as const,
    summary: (projectId: string, id: string) =>
      ['projects', projectId, 'runs', id, 'summary'] as const,
    logs: (projectId: string, id: string) =>
      ['projects', projectId, 'runs', id, 'logs'] as const,
  },
  testResults: {
    all: (projectId: string, runId: string) =>
      ['projects', projectId, 'runs', runId, 'results'] as const,
    detail: (projectId: string, runId: string, id: string) =>
      ['projects', projectId, 'runs', runId, 'results', id] as const,
  },
};
