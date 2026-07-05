import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { fetchToken } from "./core/auth";
import * as log from "./core/log";
import { createStateStore } from "./core/state";
import {
  ApiContext,
  createRun,
  fetchAllResults,
  importResults,
  pollJob,
  uploadAttachment,
} from "./core/testcraft";
import { fetchAuthority, findProjectId, slugify } from "./core/util";

const { readState, saveState, clearState } = createStateStore(
  `${process.env["CI_PIPELINE_ID"] ?? "local"}_${process.env["CI_JOB_ID"] ?? "job"}`,
);

interface Options {
  command: string;
  apiUrl: string;
  username: string;
  password: string;
  projectName: string;
  runName: string;
  junitXml?: string;
  keycloakAuthority?: string;
  source?: string;
  screenshotsDir?: string;
  runId?: string;
  dotenvPath?: string;
}

const parseArgs = (argv: string[]): Options => {
  const [maybeCommand, ...rest] = argv;
  const command =
    maybeCommand && !maybeCommand.startsWith("--") ? maybeCommand : "import";
  const flagArgs = maybeCommand === command ? rest : argv;

  const values = new Map<string, string>();
  for (let i = 0; i < flagArgs.length; i++) {
    const arg = flagArgs[i];
    if (!arg?.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = flagArgs[i + 1];
    if (next === undefined || next.startsWith("--")) {
      values.set(key, "true");
    } else {
      values.set(key, next);
      i++;
    }
  }

  const env = process.env;
  const opt = (key: string, envVar: string): string | undefined =>
    values.get(key) ?? env[envVar] ?? undefined;

  return {
    command,
    apiUrl: opt("api-url", "TESTCRAFT_API_URL") ?? "",
    username: opt("username", "TESTCRAFT_USERNAME") ?? "",
    password: opt("password", "TESTCRAFT_PASSWORD") ?? "",
    projectName: opt("project-name", "TESTCRAFT_PROJECT_NAME") ?? "",
    runName: opt("run-name", "TESTCRAFT_RUN_NAME") ?? env["CI_JOB_NAME"] ?? "",
    junitXml: opt("junit-xml", "TESTCRAFT_JUNIT_XML"),
    keycloakAuthority: opt(
      "keycloak-authority",
      "TESTCRAFT_KEYCLOAK_AUTHORITY",
    ),
    source: opt("source", "TESTCRAFT_SOURCE"),
    screenshotsDir: opt("screenshots-dir", "TESTCRAFT_SCREENSHOTS_DIR"),
    runId: opt("run-id", "TESTCRAFT_RUN_ID"),
    dotenvPath: opt("dotenv", "TESTCRAFT_DOTENV_PATH"),
  };
};

const writeDotenv = (path: string, runId: string): void => {
  writeFileSync(path, `TESTCRAFT_RUN_ID=${runId}\n`, "utf8");
};

const authenticate = async (opts: Options): Promise<string> => {
  let authority = opts.keycloakAuthority;
  if (!authority) {
    log.info("Fetching auth config…");
    authority = await fetchAuthority(opts.apiUrl);
  }
  log.info("Authenticating with Keycloak…");
  return fetchToken(authority, opts.username, opts.password);
};

const buildContext = async (opts: Options): Promise<ApiContext> => {
  const token = await authenticate(opts);
  log.info(`Resolving project "${opts.projectName}"…`);
  const projectId = await findProjectId(opts.apiUrl, token, opts.projectName);
  return { apiUrl: opts.apiUrl, projectId, token };
};

const handleStart = async (ctx: ApiContext, opts: Options): Promise<void> => {
  log.info("Creating Active run…");
  const activeRun = await createRun(ctx, opts.runName, "ci", opts.source);
  saveState(activeRun.id);
  if (opts.dotenvPath) writeDotenv(opts.dotenvPath, activeRun.id);
  log.info(
    `Run ${activeRun.id} is now Active (TESTCRAFT_RUN_ID=${activeRun.id})`,
  );
};

const uploadScreenshots = async (
  ctx: ApiContext,
  runId: string,
  screenshotsDir: string,
): Promise<void> => {
  log.info("Uploading screenshots as attachments…");
  const results = await fetchAllResults(ctx, runId);

  let uploaded = 0;
  for (const result of results) {
    const slug = slugify(result.testCaseName);
    const pngs = readdirSync(screenshotsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.toLowerCase().includes(slug))
      .flatMap((d) =>
        readdirSync(join(screenshotsDir, d.name))
          .filter((f) => f.endsWith(".png"))
          .map((f) => join(screenshotsDir, d.name, f)),
      );

    for (const png of pngs) {
      await uploadAttachment(ctx, runId, result.id, png, basename(png));
      uploaded++;
    }
  }

  log.info(`Uploaded ${uploaded} screenshot(s)`);
};

const handleImport = async (ctx: ApiContext, opts: Options): Promise<void> => {
  if (!opts.junitXml) {
    throw new Error(
      "--junit-xml (or TESTCRAFT_JUNIT_XML) is required for the import command",
    );
  }

  const junitXml = resolve(process.cwd(), opts.junitXml);
  const savedRunId = opts.runId ?? readState();

  if (!existsSync(junitXml)) {
    if (savedRunId) {
      log.info(
        `JUnit XML not found — completing run ${savedRunId} with no results`,
      );
      const emptyXml =
        '<?xml version="1.0" encoding="UTF-8"?><testsuites name="empty" tests="0"/>';
      const job = await importResults(
        ctx,
        opts.runName,
        emptyXml,
        opts.source,
        savedRunId,
      );
      await pollJob(ctx, job.id);
      clearState();
    } else {
      log.warn(`JUnit XML not found at ${junitXml} — skipping import`);
    }
    return;
  }

  if (savedRunId) {
    log.info(`Appending results to existing run ${savedRunId}…`);
  } else {
    log.info("No pre-created run found — creating Active run for import…");
  }

  log.info("Importing results…");
  const job = await importResults(
    ctx,
    opts.runName,
    readFileSync(junitXml, "utf8"),
    opts.source,
    savedRunId ?? undefined,
  );

  log.info("Waiting for import job to complete…");
  const completedRunId = await pollJob(ctx, job.id);
  if (opts.dotenvPath) writeDotenv(opts.dotenvPath, completedRunId ?? "");
  log.info(
    `Results imported successfully (TESTCRAFT_RUN_ID=${completedRunId ?? ""})`,
  );

  clearState();

  if (!opts.screenshotsDir || !completedRunId) return;

  const screenshotsDir = resolve(process.cwd(), opts.screenshotsDir);
  if (!existsSync(screenshotsDir)) {
    log.info(
      `Screenshots directory not found at ${screenshotsDir} — skipping attachments`,
    );
    return;
  }

  await uploadScreenshots(ctx, completedRunId, screenshotsDir);
};

const run = async (): Promise<void> => {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.apiUrl) {
    log.info("--api-url/TESTCRAFT_API_URL not set — skipping TestCraft");
    return;
  }

  if (!opts.username || !opts.password) {
    throw new Error("username and password are required when api-url is set");
  }

  if (!opts.projectName) {
    throw new Error("--project-name (or TESTCRAFT_PROJECT_NAME) is required");
  }

  if (!opts.runName) {
    throw new Error("--run-name (or TESTCRAFT_RUN_NAME) is required");
  }

  const ctx = await buildContext(opts);

  if (opts.command === "start") {
    await handleStart(ctx, opts);
    return;
  }

  await handleImport(ctx, opts);
};

run().catch((err) => {
  log.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
