import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface StateStore {
  readState: () => string | null;
  saveState: (runId: string) => void;
  clearState: () => void;
}

export const createStateStore = (namespace: string): StateStore => {
  const stateFile = join(tmpdir(), `.testcraft_${namespace}.run_id`);

  return {
    readState: () => {
      if (!existsSync(stateFile)) return null;
      return readFileSync(stateFile, "utf8").trim() || null;
    },
    saveState: (runId: string) => {
      writeFileSync(stateFile, runId, "utf8");
    },
    clearState: () => {
      writeFileSync(stateFile, "", "utf8");
    },
  };
};
