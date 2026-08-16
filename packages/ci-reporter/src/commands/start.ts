import type { Options } from '../args';
import * as log from '../core/log';
import { ApiContext, createRun } from '../core/testcraft';
import { writeDotenv } from '../dotenv';
import { saveState } from '../stateStore';

export const handleStart = async (
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
