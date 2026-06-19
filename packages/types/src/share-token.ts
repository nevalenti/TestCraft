export interface ShareToken {
  id: string;
  testRunId: string;
  token: string;
  expiresAt?: string;
  createdAt: string;
}

export interface SharedRunResponse {
  runName: string;
  environment: string;
  status: string;
  createdAt: string;
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  passRate: number;
  results: SharedResultItem[];
}

export interface SharedResultItem {
  testCaseName: string;
  status: string;
  notes?: string;
  durationMs?: number;
  executedAt: string;
}
