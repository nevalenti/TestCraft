import { createStateStore } from './core/state';

export const { readState, saveState, clearState } = createStateStore(
  `${process.env['CI_PIPELINE_ID'] ?? 'local'}_${process.env['CI_JOB_ID'] ?? 'job'}`,
);
