import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { Options } from '../args';
import * as log from '../core/log';
import { ApiContext, appendLogs } from '../core/testcraft';

const LOG_BATCH_SIZE = 300;

export const handleLogs = async (
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

  const filePath = path.resolve(process.cwd(), opts.file);
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
