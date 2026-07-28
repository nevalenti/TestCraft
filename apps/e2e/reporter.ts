import type { Reporter } from '@playwright/test/reporter';
import {
  type ApiContext,
  appendLogs,
  createStdioCapture,
  fetchAuthority,
  fetchToken,
  findProjectId,
  type StdioCapture,
} from 'testcraft-ci-reporter';

interface Ctx extends ApiContext {
  runId: string;
}

class TestCraftReporter implements Reporter {
  private context: Ctx | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly pending: Promise<void>[] = [];
  private capture: StdioCapture | null = null;

  onBegin(): void {
    const apiUrl = process.env['TESTCRAFT_API_URL'];
    const runId = process.env['TESTCRAFT_RUN_ID'];
    const username = process.env['TESTCRAFT_USERNAME'];
    const password = process.env['TESTCRAFT_PASSWORD'];
    const projectName = process.env['TESTCRAFT_PROJECT_NAME'];
    const keycloakAuthority = process.env['TESTCRAFT_KEYCLOAK_AUTHORITY'];

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

      this.context = { apiUrl, projectId, token, runId };
    } catch (error) {
      console.warn(`[TestCraft] Reporter init failed: ${error}`);
    }
  }

  private postLog(lines: string[]): void {
    if (!this.initPromise || lines.length === 0) return;
    const logPromise = this.initPromise.then(() => this.sendLogs(lines));
    this.pending.push(logPromise);
  }

  private async sendLogs(lines: string[]): Promise<void> {
    if (!this.context) return;
    try {
      await appendLogs(this.context, this.context.runId, lines);
    } catch {
      // non-critical — swallow silently
    }
  }

  async onEnd(): Promise<void> {
    this.capture?.flush();
    this.capture?.restore();
    await Promise.allSettled(this.pending);
  }
}

export default TestCraftReporter;
