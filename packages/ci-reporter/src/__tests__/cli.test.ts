import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { parseArgs } from "../cli";

const ENV_KEYS = [
  "TESTCRAFT_API_URL",
  "TESTCRAFT_USERNAME",
  "TESTCRAFT_PASSWORD",
  "TESTCRAFT_PROJECT_NAME",
  "TESTCRAFT_RUN_NAME",
  "TESTCRAFT_JUNIT_XML",
  "CI_JOB_NAME",
] as const;

describe("parseArgs", () => {
  let savedEnv: Record<string, string | undefined>;

  beforeEach(() => {
    savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    for (const key of ENV_KEYS) delete process.env[key];
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  });

  describe("parseArgs — given no leading command token — defaults to the import command", () => {
    it("treats the first flag-looking arg as the start of flags, not a command", () => {
      const opts = parseArgs(["--api-url", "https://api.example.com"]);
      expect(opts.command).toBe("import");
      expect(opts.apiUrl).toBe("https://api.example.com");
    });
  });

  describe("parseArgs — given a leading non-flag token — treats it as the command", () => {
    it("parses 'start' as the command", () => {
      const opts = parseArgs(["start", "--api-url", "https://api.example.com"]);
      expect(opts.command).toBe("start");
      expect(opts.apiUrl).toBe("https://api.example.com");
    });
  });

  describe("parseArgs — given both a CLI flag and an env var for the same option — the CLI flag wins", () => {
    it("prefers --api-url over TESTCRAFT_API_URL", () => {
      process.env["TESTCRAFT_API_URL"] = "https://env.example.com";
      const opts = parseArgs(["--api-url", "https://flag.example.com"]);
      expect(opts.apiUrl).toBe("https://flag.example.com");
    });
  });

  describe("parseArgs — given only an env var — falls back to it", () => {
    it("reads TESTCRAFT_PROJECT_NAME when --project-name is absent", () => {
      process.env["TESTCRAFT_PROJECT_NAME"] = "My Project";
      const opts = parseArgs([]);
      expect(opts.projectName).toBe("My Project");
    });
  });

  describe("parseArgs — given neither a flag nor an env var — defaults to an empty string", () => {
    it("leaves username empty", () => {
      const opts = parseArgs([]);
      expect(opts.username).toBe("");
    });
  });

  describe("parseArgs — given run-name is unset — falls back to CI_JOB_NAME, then empty string", () => {
    it("uses CI_JOB_NAME when TESTCRAFT_RUN_NAME and --run-name are both absent", () => {
      process.env["CI_JOB_NAME"] = "build-job";
      const opts = parseArgs([]);
      expect(opts.runName).toBe("build-job");
    });

    it("is empty when nothing is set", () => {
      const opts = parseArgs([]);
      expect(opts.runName).toBe("");
    });
  });

  describe("parseArgs — given a flag with no following value — throws", () => {
    it("throws when the flag is the last argument", () => {
      expect(() =>
        parseArgs(["--api-url", "https://x.test", "--dotenv"]),
      ).toThrow();
    });
  });

  describe("parseArgs — given an unknown command — throws", () => {
    it("throws for a typo'd command", () => {
      expect(() =>
        parseArgs(["star", "--api-url", "https://x.test"]),
      ).toThrow();
    });
  });
});
