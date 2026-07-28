import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { parseArgs as parseNodeArgs } from 'node:util';

import { fetchToken } from './core/auth';
import { resolveJunitXml } from './core/junit';
import * as log from './core/log';
import { createStateStore } from './core/state';
import {
  ApiContext,
  appendLogs,
  createRun,
  fetchAllResults,
  importResults,
  pollJob,
  uploadAttachment,
} from './core/testcraft';
import { fetchAuthority, findProjectId, slugify } from './core/util';

const { readState, saveState, clearState } = createStateStore(
  `${process.env['CI_PIPELINE_ID'] ?? 'local'}_${process.env['CI_JOB_ID'] ?? 'job'}`,
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
  file?: string;
}

const FLAG_OPTIONS = {
  'api-url': { type: 'string' },
  username: { type: 'string' },
  password: { type: 'string' },
  'project-name': { type: 'string' },
  'run-name': { type: 'string' },
  'junit-xml': { type: 'string' },
  'keycloak-authority': { type: 'string' },
  source: { type: 'string' },
  'screenshots-dir': { type: 'string' },
  'run-id': { type: 'string' },
  dotenv: { type: 'string' },
  file: { type: 'string' },
} as const;

const COMMANDS = ['start', 'import', 'logs'] as const;
const LOG_BATCH_SIZE = 300;

export const parseArgs = (argv: string[]): Options => {
  const [maybeCommand, ...rest] = argv;
  const hasCommand =
    maybeCommand !== undefined && !maybeCommand.startsWith('-');
  const command = hasCommand ? maybeCommand : 'import';
  const flagArgs = hasCommand ? rest : argv;

  if (!COMMANDS.includes(command as (typeof COMMANDS)[number])) {
    throw new Error(
      `Unknown command "${command}" — expected one of: ${COMMANDS.join(', ')}`,
    );
  }

  const { values } = parseNodeArgs({
    args: flagArgs,
    options: FLAG_OPTIONS,
    strict: true,
    allowPositionals: false,
  });

  const env = process.env;
  const opt = (
    key: keyof typeof FLAG_OPTIONS,
    envVar: string,
  ): string | undefined => values[key] ?? env[envVar] ?? undefined;

  return {
    command,
    apiUrl: opt('api-url', 'TESTCRAFT_API_URL') ?? '',
    username: opt('username', 'TESTCRAFT_USERNAME') ?? '',
    password: opt('password', 'TESTCRAFT_PASSWORD') ?? '',
    projectName: opt('project-name', 'TESTCRAFT_PROJECT_NAME') ?? '',
    runName: opt('run-name', 'TESTCRAFT_RUN_NAME') ?? env['CI_JOB_NAME'] ?? '',
    junitXml: opt('junit-xml', 'TESTCRAFT_JUNIT_XML'),
    keycloakAuthority: opt(
      'keycloak-authority',
      'TESTCRAFT_KEYCLOAK_AUTHORITY',
    ),
    source: opt('source', 'TESTCRAFT_SOURCE'),
    screenshotsDir: opt('screenshots-dir', 'TESTCRAFT_SCREENSHOTS_DIR'),
    runId: opt('run-id', 'TESTCRAFT_RUN_ID'),
    dotenvPath: opt('dotenv', 'TESTCRAFT_DOTENV_PATH'),
    file: opt('file', 'TESTCRAFT_LOG_FILE'),
  };
};

const writeDotenv = (path: string, runId: string): void => {
  writeFileSync(path, `TESTCRAFT_RUN_ID=${runId}\n`, 'utf8');
};

const authenticate = async (opts: Options): Promise<string> => {
  let authority = opts.keycloakAuthority;
  if (!authority) {
    log.info('Fetching auth config…');
    authority = await fetchAuthority(opts.apiUrl);
  }
  log.info('Authenticating with Keycloak…');
  return fetchToken(authority, opts.username, opts.password);
};

const buildContext = async (opts: Options): Promise<ApiContext> => {
  const token = await authenticate(opts);
  log.info(`Resolving project "${opts.projectName}"…`);
  const projectId = await findProjectId(opts.apiUrl, token, opts.projectName);
  return { apiUrl: opts.apiUrl, projectId, token };
};

const handleStart = async (
  context: ApiContext,
  opts: Options,
): Promise<void> => {
  log.info('Creating Active run…');
  const activeRun = await createRun(context, opts.runName, 'ci', opts.source);
  saveState(activeRun.id);
  if (opts.dotenvPath) writeDotenv(opts.dotenvPath, activeRun.id);
  log.info(
    `Run ${activeRun.id} is now Active (TESTCRAFT_RUN_ID=${activeRun.id})`,
  );
};

const handleLogs = async (
  context: ApiContext,
  opts: Options,
): Promise<void> => {
  const runId = opts.runId;
  if (!runId) {
    throw new Error(
      '--run-id (or TESTCRAFT_RUN_ID) is required for the logs command',
    );
  }
  if (!opts.file) {
    throw new Error(
      '--file (or TESTCRAFT_LOG_FILE) is required for the logs command',
    );
  }

  const filePath = resolve(process.cwd(), opts.file);
  if (!existsSync(filePath)) {
    log.warn(`Log file not found at ${filePath} — skipping`);
    return;
  }

  const lines = readFileSync(filePath, 'utf8')
    .split('\n')
    .filter((line) => line.length > 0);

  log.info(`Uploading ${lines.length} log line(s) to run ${runId}…`);
  for (let i = 0; i < lines.length; i += LOG_BATCH_SIZE) {
    await appendLogs(context, runId, lines.slice(i, i + LOG_BATCH_SIZE));
  }
  log.info('Logs uploaded successfully');
};

const uploadScreenshots = async (
  context: ApiContext,
  runId: string,
  screenshotsDir: string,
): Promise<void> => {
  log.info('Uploading screenshots as attachments…');
  const results = await fetchAllResults(context, runId);
  const screenshotDirs = readdirSync(screenshotsDir, {
    withFileTypes: true,
  }).filter((entry) => entry.isDirectory());

  let uploaded = 0;
  for (const result of results) {
    const slug = slugify(result.testCaseName);
    const pngs = screenshotDirs
      .filter((dir) => dir.name.toLowerCase().includes(slug))
      .flatMap((dir) =>
        readdirSync(join(screenshotsDir, dir.name))
          .filter((file) => file.endsWith('.png'))
          .map((file) => join(screenshotsDir, dir.name, file)),
      );

    for (const png of pngs) {
      await uploadAttachment(context, runId, result.id, png, basename(png));
      uploaded++;
    }
  }

  log.info(`Uploaded ${uploaded} screenshot(s)`);
};

const handleImport = async (
  context: ApiContext,
  opts: Options,
): Promise<void> => {
  if (!opts.junitXml) {
    throw new Error(
      '--junit-xml (or TESTCRAFT_JUNIT_XML) is required for the import command',
    );
  }

  const junitXml = resolve(process.cwd(), opts.junitXml);
  const xml = resolveJunitXml(opts.junitXml, process.cwd());
  const savedRunId = opts.runId ?? readState();

  if (xml === null) {
    if (savedRunId) {
      log.info(
        `JUnit XML not found — completing run ${savedRunId} with no results`,
      );
      const emptyXml =
        '<?xml version="1.0" encoding="UTF-8"?><testsuites name="empty" tests="0"/>';
      const job = await importResults(
        context,
        opts.runName,
        emptyXml,
        opts.source,
        savedRunId,
      );
      await pollJob(context, job.id);
      clearState();
    } else {
      log.warn(`JUnit XML not found at ${junitXml} — skipping import`);
    }
    return;
  }

  if (savedRunId) {
    log.info(`Appending results to existing run ${savedRunId}…`);
  } else {
    log.info('No pre-created run found — creating Active run for import…');
  }

  log.info('Importing results…');
  const job = await importResults(
    context,
    opts.runName,
    xml,
    opts.source,
    savedRunId ?? undefined,
  );

  log.info('Waiting for import job to complete…');
  const completedRunId = await pollJob(context, job.id);
  if (opts.dotenvPath) writeDotenv(opts.dotenvPath, completedRunId ?? '');
  log.info(
    `Results imported successfully (TESTCRAFT_RUN_ID=${completedRunId ?? ''})`,
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

  await uploadScreenshots(context, completedRunId, screenshotsDir);
};

const run = async (): Promise<void> => {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.apiUrl) {
    log.info('--api-url/TESTCRAFT_API_URL not set — skipping TestCraft');
    return;
  }

  if (!opts.username || !opts.password) {
    throw new Error('username and password are required when api-url is set');
  }

  if (!opts.projectName) {
    throw new Error('--project-name (or TESTCRAFT_PROJECT_NAME) is required');
  }

  if (!opts.runName) {
    throw new Error('--run-name (or TESTCRAFT_RUN_NAME) is required');
  }

  const context = await buildContext(opts);

  if (opts.command === 'start') {
    await handleStart(context, opts);
    return;
  }

  if (opts.command === 'logs') {
    await handleLogs(context, opts);
    return;
  }

  await handleImport(context, opts);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    log.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
