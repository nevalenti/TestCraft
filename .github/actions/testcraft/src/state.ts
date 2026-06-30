import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Scoped to this workflow run + job so parallel jobs don't collide.
const stateFile = join(
  process.env["RUNNER_TEMP"] ?? tmpdir(),
  `.testcraft_${process.env["GITHUB_RUN_ID"] ?? "local"}_${process.env["GITHUB_JOB"] ?? "job"}.run_id`,
);

export const readState = (): string | null => {
  if (!existsSync(stateFile)) return null;
  return readFileSync(stateFile, "utf8").trim() || null;
};

export const saveState = (runId: string): void => {
  writeFileSync(stateFile, runId, "utf8");
};

export const clearState = (): void => {
  writeFileSync(stateFile, "", "utf8");
};
