import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";

const USER_AGENT = "TestCraft-Reporter/1.0";

const STATUS_MAP: Record<string, string> = {
  passed: "Passed",
  failed: "Failed",
  skipped: "Skipped",
  timedOut: "Failed",
  interrupted: "Failed",
};

interface Ctx {
  apiUrl: string;
  projectId: string;
  token: string;
  runId: string;
  source: string | undefined;
}

class TestCraftReporter implements Reporter {
  private ctx: Ctx | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly pending: Promise<void>[] = [];

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
      let authority = keycloakAuthority;
      if (!authority) {
        const cfgRes = await fetch(`${apiUrl}/api/auth-config`, {
          headers: { "User-Agent": USER_AGENT },
        });
        const cfg = (await cfgRes.json()) as { authority: string };
        authority = cfg.authority;
      }

      const tokenRes = await fetch(
        `${authority}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "password",
            client_id: "testcraft-web",
            username,
            password,
          }),
        },
      );
      const { access_token } = (await tokenRes.json()) as {
        access_token: string;
      };

      const url = new URL(`${apiUrl}/api/v1/projects`);
      url.searchParams.set("search", projectName);
      url.searchParams.set("pageSize", "500");
      const projRes = await fetch(url, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "User-Agent": USER_AGENT,
        },
      });
      const { items } = (await projRes.json()) as {
        items: { id: string; name: string }[];
      };
      const project = items.find((p) => p.name === projectName);
      if (!project) throw new Error(`Project "${projectName}" not found`);

      this.ctx = {
        apiUrl,
        projectId: project.id,
        token: access_token,
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
      await fetch(
        `${this.ctx.apiUrl}/api/v1/projects/${this.ctx.projectId}/runs/${this.ctx.runId}/logs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.ctx.token}`,
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
          },
          body: JSON.stringify({ lines }),
        },
      );
    } catch {
      // non-critical — swallow silently
    }
  }

  onTestBegin(test: TestCase): void {
    const suiteName = test.parent.title || "Default";
    this.postLog([`▶  ${suiteName} › ${test.title}`]);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (!this.initPromise) return;
    const p = this.initPromise.then(() => this.report(test, result));
    this.pending.push(p);
  }

  onStdOut(chunk: string | Buffer): void {
    const text = chunk.toString().trimEnd();
    if (!text) return;
    this.postLog(text.split("\n").filter(Boolean));
  }

  onStdErr(chunk: string | Buffer): void {
    const text = chunk.toString().trimEnd();
    if (!text) return;
    this.postLog(
      text
        .split("\n")
        .filter(Boolean)
        .map((l: string) => `[err] ${l}`),
    );
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
    await Promise.allSettled(this.pending);
  }
}

export default TestCraftReporter;
