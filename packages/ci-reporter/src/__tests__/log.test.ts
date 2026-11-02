import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { error, info, setSecret, warn } from "../core/log";

describe("log", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("info — given no secrets registered — logs the message unchanged", () => {
    it("passes the message straight to console.log", () => {
      info("hello world");
      expect(logSpy).toHaveBeenCalledWith("hello world");
    });
  });

  describe("warn — given no secrets registered — prefixes with WARNING", () => {
    it("logs via console.warn", () => {
      warn("careful");
      expect(warnSpy).toHaveBeenCalledWith("WARNING: careful");
    });
  });

  describe("error — given no secrets registered — prefixes with ERROR", () => {
    it("logs via console.error", () => {
      error("boom");
      expect(errorSpy).toHaveBeenCalledWith("ERROR: boom");
    });
  });

  describe("setSecret — given a value registered as a secret — redacts it from all subsequent log levels", () => {
    it("redacts the secret from info", () => {
      setSecret("super-secret-token");
      info("token is super-secret-token");
      expect(logSpy).toHaveBeenCalledWith("token is ***");
    });

    it("redacts the secret from warn and error", () => {
      setSecret("another-secret");
      warn("leaked another-secret here");
      error("also another-secret here");
      expect(warnSpy).toHaveBeenCalledWith("WARNING: leaked *** here");
      expect(errorSpy).toHaveBeenCalledWith("ERROR: also *** here");
    });

    it("redacts every occurrence when the secret appears multiple times", () => {
      setSecret("dup-secret");
      info("dup-secret and dup-secret again");
      expect(logSpy).toHaveBeenCalledWith("*** and *** again");
    });
  });

  describe("setSecret — given an empty string — does not register it as a secret", () => {
    it("leaves messages containing empty substrings unaffected", () => {
      setSecret("");
      info("nothing to redact here");
      expect(logSpy).toHaveBeenCalledWith("nothing to redact here");
    });
  });
});
