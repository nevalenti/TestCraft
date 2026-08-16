import { parseArgs } from './args';
import { handleImport } from './commands/import';
import { handleLogs } from './commands/logs';
import { handleStart } from './commands/start';
import { buildContext } from './context';
import * as log from './core/log';

export { parseArgs } from './args';

const run = async (): Promise<void> => {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.apiUrl) {
    log.info('--api-url/TESTCRAFT_API_URL not set — skipping TestCraft');
    return;
  }

  const hasClientCredentials = Boolean(opts.clientId && opts.clientSecret);
  const hasPasswordCredentials = Boolean(opts.username && opts.password);
  if (!hasClientCredentials && !hasPasswordCredentials) {
    throw new Error(
      'either client-id/client-secret or username/password are required when api-url is set',
    );
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
  try {
    await run();
  } catch (error) {
    log.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
