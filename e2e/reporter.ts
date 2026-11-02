import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import {
  type ApiContext,
  appendLogs,
  authenticate,
  fetchAuthority,
  findProjectId,
} from "testcraft-ci-reporter";

interface Context extends ApiContext {
  runId: string;
}

type Credentials =
  | { clientId: string; clientSecret: string }
  | { username: string; password: string };

const resolveCredentials = (
  env: NodeJS.ProcessEnv,
): Credentials | undefined => {
  const clientId = env.TESTCRAFT_CLIENT_ID;
  const clientSecret = env.TESTCRAFT_CLIENT_SECRET;
  if (clientId && clientSecret) return { clientId, clientSecret };
  const username = env.TESTCRAFT_USERNAME;
  const password = env.TESTCRAFT_PASSWORD;
  if (username && password) return { username, password };
  return undefined;
};

class TestCraftReporter implements Reporter {
  private context: Context | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly pending: Promise<void>[] = [];
  private readonly buffers = { stdout: "", stderr: "" };
  private deliveryWarningShown = false;

  private readonly env: NodeJS.ProcessEnv;

  constructor(options: { env?: NodeJS.ProcessEnv } = {}) {
    this.env = options.env ?? process.env;
  }

  private async init(apiUrl: string, runId: string): Promise<void> {
    try {
      let token = this.env.TESTCRAFT_TOKEN;
      if (!token) {
        const authority =
          this.env.TESTCRAFT_KEYCLOAK_AUTHORITY ??
          (await fetchAuthority(apiUrl));
        token = await authenticate(authority, resolveCredentials(this.env)!);
      }
      const projectId =
        this.env.TESTCRAFT_PROJECT_ID ??
        (await findProjectId(apiUrl, token, this.env.TESTCRAFT_PROJECT_NAME!));
      this.context = { apiUrl, projectId, token, runId };
    } catch {
      console.warn(
        "[TestCraft] Reporter initialization failed; live logs are disabled.",
      );
    }
  }

  private postLog(lines: string[]): void {
    if (!this.initPromise || lines.length === 0) return;
    this.pending.push(
      (async () => {
        await this.initPromise;
        if (!this.context) return;
        try {
          await appendLogs(this.context, this.context.runId, lines);
        } catch {
          if (!this.deliveryWarningShown) {
            this.deliveryWarningShown = true;
            console.warn(
              "[TestCraft] Live log delivery failed; test execution will continue.",
            );
          }
        }
      })(),
    );
  }

  private capture(stream: "stdout" | "stderr", chunk: string | Buffer): void {
    if (!this.initPromise) return;
    const lines = (this.buffers[stream] + chunk.toString()).split(/\r?\n/);
    this.buffers[stream] = lines.pop() ?? "";
    this.postLog(lines);
  }

  onTestBegin(test: TestCase): void {
    this.postLog([`[running] ${test.titlePath().filter(Boolean).join(" > ")}`]);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.postLog([
      `[${result.status}] ${test.titlePath().filter(Boolean).join(" > ")}`,
    ]);
  }

  onStdOut(chunk: string | Buffer): void {
    this.capture("stdout", chunk);
  }

  onStdErr(chunk: string | Buffer): void {
    this.capture("stderr", chunk);
  }

  onBegin(): void {
    const { TESTCRAFT_API_URL: apiUrl, TESTCRAFT_RUN_ID: runId } = this.env;
    if (!runId) return;
    if (
      !apiUrl ||
      (!this.env.TESTCRAFT_TOKEN && !resolveCredentials(this.env)) ||
      (!this.env.TESTCRAFT_PROJECT_ID && !this.env.TESTCRAFT_PROJECT_NAME)
    ) {
      console.warn(
        "[TestCraft] Incomplete reporter configuration: provide API_URL, RUN_ID, " +
          "TOKEN (or credentials), and PROJECT_ID (or PROJECT_NAME), all prefixed with TESTCRAFT_.",
      );
      return;
    }
    this.initPromise = this.init(apiUrl, runId);
  }

  async onEnd(): Promise<void> {
    for (const stream of ["stdout", "stderr"] as const) {
      const remainder = this.buffers[stream];
      if (remainder) this.postLog([remainder]);
      this.buffers[stream] = "";
    }
    await this.initPromise;
    await Promise.allSettled(this.pending);
  }
}

export default TestCraftReporter;
