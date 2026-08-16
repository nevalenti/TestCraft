import { writeFileSync } from 'node:fs';

export const writeDotenv = (filePath: string, runId: string): void => {
  writeFileSync(filePath, `TESTCRAFT_RUN_ID=${runId}\n`, 'utf8');
};
