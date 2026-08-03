import type { Reporter } from '@playwright/test/reporter';
import {
  type ApiContext,
  appendLogs,
  authenticate,
  createStdioCapture,
  fetchAuthority,
  findProjectId,
  type StdioCapture,
} from 'testcraft-ci-reporter';

interface Ctx extends ApiContext {
  runId: string;
}

type Credentials =
  | { clientId: string; clientSecret: string }
  | { username: string; password: string };

const resolveCredentials = (): Credentials | undefined => {
  const clientId = process.env['TESTCRAFT_CLIENT_ID'];
  const clientSecret = process.env['TESTCRAFT_CLIENT_SECRET'];
  if (clientId && clientSecret) return { clientId, clientSecret };

  const username = process.env['TESTCRAFT_USERNAME'];
  const password = process.env['TESTCRAFT_PASSWORD'];
  if (username && password) return { username, password };

  return undefined;
};

class TestCraftReporter implements Reporter {
  private context: Ctx | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly pending: Promise<void>[] = [];
  private capture: StdioCapture | null = null;

  private async init(
    apiUrl: string,
    runId: string,
    credentials: Credentials,
    projectName: string,
    keycloakAuthority: string | undefined,
  ): Promise<void> {
    try {
      const authority = keycloakAuthority ?? (await fetchAuthority(apiUrl));
      const token = await authenticate(authority, credentials);
      const projectId = await findProjectId(apiUrl, token, projectName);

      this.context = { apiUrl, projectId, token, runId };
    } catch (error) {
      console.warn(`[TestCraft] Reporter init failed: ${error}`);
    }
  }

  private async sendLogs(lines: string[]): Promise<void> {
    if (!this.context) return;
    try {
      await appendLogs(this.context, this.context.runId, lines);
    } catch {}
  }

  private async trackLogs(lines: string[]): Promise<void> {
    await this.initPromise;
    await this.sendLogs(lines);
  }

  private postLog(lines: string[]): void {
    if (!this.initPromise || lines.length === 0) return;
    this.pending.push(this.trackLogs(lines));
  }

  onBegin(): void {
    const apiUrl = process.env['TESTCRAFT_API_URL'];
    const runId = process.env['TESTCRAFT_RUN_ID'];
    const projectName = process.env['TESTCRAFT_PROJECT_NAME'];
    const keycloakAuthority = process.env['TESTCRAFT_KEYCLOAK_AUTHORITY'];
    const credentials = resolveCredentials();

    if (!apiUrl || !runId || !credentials || !projectName) return;

    this.initPromise = this.init(
      apiUrl,
      runId,
      credentials,
      projectName,
      keycloakAuthority,
    );

    this.capture = createStdioCapture((lines) => this.postLog(lines));
  }

  async onEnd(): Promise<void> {
    this.capture?.flush();
    this.capture?.restore();
    await Promise.allSettled(this.pending);
  }
}

export default TestCraftReporter;
