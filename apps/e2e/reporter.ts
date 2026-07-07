import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import {
  type ApiContext,
  appendLogs,
  createStdioCapture,
  fetchAuthority,
  fetchToken,
  findProjectId,
  type StdioCapture,
} from "@testcraft/ci-reporter";

const USER_AGENT = "TestCraft-Reporter/1.0";

const STATUS_MAP: Record<string, string> = {
  passed: "Passed",
  failed: "Failed",
  skipped: "Skipped",
  timedOut: "Failed",
  interrupted: "Failed",
};

interface Ctx extends ApiContext {
  runId: string;
  source: string | undefined;
}

class TestCraftReporter implements Reporter {
  private ctx: Ctx | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly pending: Promise<void>[] = [];
  private capture: StdioCapture | null = null;

  onBegin(): void {
    const apiUrl = process.env["TESTCRAFT_API_URL"];
    const runId = process.env["TESTCRAFT_RUN_ID"];
    const username = process.env["TESTCRAFT_USERNAME"];
    const password = process.env["TESTCRAFT_PASSWORD"];
    const projectName = process.env["TESTCRAFT_PROJECT_NAME"];
    const keycloakAuthority = process.env["TESTCRAFT_KEYCLOAK_AUTHORITY"];

    if (!apiUrl || !runId || !username || !password || !projectName) return;

    this.initPromise = this.init(
      apiUrl,
      runId,
      username,
      password,
      projectName,
      keycloakAuthority,
    );

    this.capture = createStdioCapture((lines) => this.postLog(lines));
  }

  private async init(
    apiUrl: string,
    runId: string,
    username: string,
    password: string,
    projectName: string,
    keycloakAuthority: string | undefined,
  ): Promise<void> {
    try {
      const authority = keycloakAuthority ?? (await fetchAuthority(apiUrl));
      const token = await fetchToken(authority, username, password);
      const projectId = await findProjectId(apiUrl, token, projectName);

      this.ctx = {
        apiUrl,
        projectId,
        token,
        runId,
        source: process.env["TESTCRAFT_SOURCE"],
      };
    } catch (err) {
      console.warn(`[TestCraft] Reporter init failed: ${err}`);
    }
  }

  private postLog(lines: string[]): void {
    if (!this.initPromise || lines.length === 0) return;
    const p = this.initPromise.then(() => this.sendLogs(lines));
    this.pending.push(p);
  }

  private async sendLogs(lines: string[]): Promise<void> {
    if (!this.ctx) return;
    try {
      await appendLogs(this.ctx, this.ctx.runId, lines);
    } catch {
      // non-critical — swallow silently
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (!this.initPromise) return;
    const p = this.initPromise.then(() => this.report(test, result));
    this.pending.push(p);
  }

  private async report(test: TestCase, result: TestResult): Promise<void> {
    if (!this.ctx) return;

    const status = STATUS_MAP[result.status] ?? "Failed";
    const suiteName = test.parent.title || "Default";
    const notes =
      result.errors
        .map((e) => e.message ?? "")
        .filter(Boolean)
        .join("\n")
        .slice(0, 5000) || undefined;

    try {
      const res = await fetch(
        `${this.ctx.apiUrl}/api/v1/projects/${this.ctx.projectId}/runs/${this.ctx.runId}/results/by-name`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.ctx.token}`,
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
          },
          body: JSON.stringify({
            suiteName,
            testCaseName: test.title,
            status,
            durationMs: Math.round(result.duration),
            notes,
            source: this.ctx.source,
            executedAt: result.startTime.toISOString(),
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        console.warn(
          `[TestCraft] Failed to record "${test.title}": ${res.status} ${text}`,
        );
      }
    } catch (err) {
      console.warn(`[TestCraft] Error recording "${test.title}": ${err}`);
    }
  }

  async onEnd(): Promise<void> {
    this.capture?.flush();
    this.capture?.restore();
    await Promise.allSettled(this.pending);
  }
}

export default TestCraftReporter;
