import {
  type ApiContext,
  appendLogs,
  createStdioCapture,
  fetchAuthority,
  fetchToken,
  findProjectId,
  type StdioCapture,
} from "@testcraft/ci-reporter";
import type { Reporter } from "vitest/node";

interface Ctx extends ApiContext {
  runId: string;
}

class TestCraftReporter implements Reporter {
  private ctx: Ctx | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly pending: Promise<void>[] = [];
  private capture: StdioCapture | null = null;

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

      this.ctx = { apiUrl, projectId, token, runId };
    } catch (error) {
      console.warn(`[TestCraft] Reporter init failed: ${error}`);
    }
  }

  private postLog(lines: string[]): void {
    if (!this.initPromise || lines.length === 0) return;
    const p = (async () => {
      await this.initPromise;
      await this.sendLogs(lines);
    })();
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

  onInit(): void {
    const apiUrl = process.env["TESTCRAFT_API_URL"];
    const runId = process.env["TESTCRAFT_RUN_ID"];
    const username = process.env["TESTCRAFT_USERNAME"];
    const password = process.env["TESTCRAFT_PASSWORD"];
    const projectName = process.env["TESTCRAFT_PROJECT_NAME"];

    if (!apiUrl || !runId || !username || !password || !projectName) return;

    const keycloakAuthority = process.env["TESTCRAFT_KEYCLOAK_AUTHORITY"];

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

  async onTestRunEnd(): Promise<void> {
    this.capture?.flush();
    this.capture?.restore();
    await Promise.allSettled(this.pending);
  }
}

export default TestCraftReporter;
