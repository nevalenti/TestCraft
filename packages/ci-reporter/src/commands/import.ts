import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

import type { Options } from '../args';
import { resolveJunitXml } from '../core/junit';
import * as log from '../core/log';
import {
  ApiContext,
  fetchAllResults,
  importResults,
  pollJob,
  uploadAttachment,
} from '../core/testcraft';
import { slugify } from '../core/util';
import { writeDotenv } from '../dotenv';
import { clearState, readState } from '../stateStore';

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
    const pngs = screenshotDirs.flatMap((dir) =>
      dir.name.toLowerCase().includes(slug)
        ? readdirSync(path.join(screenshotsDir, dir.name))
            .filter((file) => file.endsWith('.png'))
            .map((file) => path.join(screenshotsDir, dir.name, file))
        : [],
    );

    for (const png of pngs) {
      await uploadAttachment(
        context,
        runId,
        result.id,
        png,
        path.basename(png),
      );
      uploaded++;
    }
  }

  log.info(`Uploaded ${uploaded} screenshot(s)`);
};

const completeEmptyRun = async (
  context: ApiContext,
  opts: Options,
  junitXmlPattern: string,
  savedRunId: string | null,
): Promise<void> => {
  if (!savedRunId) {
    log.warn(
      `JUnit XML not found at ${path.resolve(process.cwd(), junitXmlPattern)} — skipping import`,
    );
    return;
  }

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
};

const importAndPoll = async (
  context: ApiContext,
  opts: Options,
  xml: string,
  savedRunId: string | null,
): Promise<string | null> => {
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
  return pollJob(context, job.id);
};

const finalizeRun = (opts: Options, completedRunId: string | null): void => {
  if (opts.dotenvPath) writeDotenv(opts.dotenvPath, completedRunId ?? '');
  log.info(
    `Results imported successfully (TESTCRAFT_RUN_ID=${completedRunId ?? ''})`,
  );
  clearState();
};

const maybeUploadScreenshots = async (
  context: ApiContext,
  opts: Options,
  completedRunId: string | null,
): Promise<void> => {
  if (!opts.screenshotsDir || !completedRunId) return;

  const screenshotsDir = path.resolve(process.cwd(), opts.screenshotsDir);
  if (!existsSync(screenshotsDir)) {
    log.info(
      `Screenshots directory not found at ${screenshotsDir} — skipping attachments`,
    );
    return;
  }

  await uploadScreenshots(context, completedRunId, screenshotsDir);
};

export const handleImport = async (
  context: ApiContext,
  opts: Options,
): Promise<void> => {
  const junitXmlPattern = opts.junitXml;
  if (!junitXmlPattern) {
    throw new Error(
      '--junit-xml (or TESTCRAFT_JUNIT_XML) is required for the import command',
    );
  }

  const xml = resolveJunitXml(junitXmlPattern, process.cwd());
  const savedRunId = opts.runId ?? readState();

  if (xml === null) {
    await completeEmptyRun(context, opts, junitXmlPattern, savedRunId);
    return;
  }

  const completedRunId = await importAndPoll(context, opts, xml, savedRunId);
  finalizeRun(opts, completedRunId);
  await maybeUploadScreenshots(context, opts, completedRunId);
};
