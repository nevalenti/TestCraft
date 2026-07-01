export interface TrendPoint {
  runId: string;
  runName: string;
  createdAt: string;
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  passRate: number;
  source?: string;
}

export interface SuiteBreakdown {
  suiteName: string;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
}

export interface FlakyTestStat {
  testCaseId: string;
  testCaseName: string;
  totalRuns: number;
  passCount: number;
  failCount: number;
  flakRate: number;
}

export interface RunComparison {
  runAName: string;
  runBName: string;
  results: ComparisonRow[];
}

export interface ComparisonRow {
  testCaseId: string;
  testCaseName: string;
  statusInA?: string;
  statusInB?: string;
  isRegression: boolean;
  isFix: boolean;
}

export interface ApiTokenResponse {
  id: string;
  name: string;
  projectId: string;
  lastUsedAt?: string;
  expiresAt?: string;
  isRevoked: boolean;
  createdAt: string;
}

export interface CreateApiTokenResponse {
  id: string;
  name: string;
  token: string;
}

export interface CreateApiToken {
  name: string;
  expiresAt?: string;
}
