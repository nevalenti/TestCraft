import { expect, test } from "@playwright/test";
import type { TestCase, TestResult } from "@playwright/test/reporter";

import TestCraftReporter from "../reporter";

type Call = { url: string; init?: RequestInit };
const calls: Call[] = [];
const warnings: string[] = [];
const originalFetch = fetch;
const originalWarn = console.warn;

const config = {
  TESTCRAFT_API_URL: "https://reporter.test",
  TESTCRAFT_RUN_ID: "run-id",
  TESTCRAFT_PROJECT_ID: "project-id",
  TESTCRAFT_TOKEN: "api-token",
};

test.beforeEach(() => {
  calls.length = 0;
  warnings.length = 0;
  console.warn = (message: string) => {
    warnings.push(message);
  };
  Object.defineProperty(globalThis, "fetch", {
    value: async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(null, { status: 204 });
    },
  });
});

test.afterEach(() => {
  Object.defineProperty(globalThis, "fetch", { value: originalFetch });
  console.warn = originalWarn;
});

test("CI token and project ID send logs without Keycloak or project discovery", async () => {
  const reporter = new TestCraftReporter({ env: config });
  reporter.onBegin();
  reporter.onStdOut("first line\npartial");
  reporter.onStdOut(" line\n");
  reporter.onStdErr(Buffer.from("last stderr line"));
  await reporter.onEnd();
  expect(calls).toHaveLength(3);
  for (const call of calls) {
    expect(call.url).toBe(
      "https://reporter.test/api/v1/projects/project-id/runs/run-id/logs",
    );
    expect(call.init?.headers).toMatchObject({
      Authorization: "Bearer api-token",
    });
  }
  expect(calls.map((call) => JSON.parse(String(call.init?.body)))).toEqual([
    { lines: ["first line"] },
    { lines: ["partial line"] },
    { lines: ["last stderr line"] },
  ]);
  expect(warnings).toEqual([]);
});

test("falls back to username/password and project-name discovery", async () => {
  Object.defineProperty(globalThis, "fetch", {
    value: async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith("/token"))
        return Response.json({ access_token: "jwt" });
      if (String(url).includes("/projects?"))
        return Response.json({
          items: [{ id: "found-project", name: "My Project" }],
          total: 1,
        });
      return new Response(null, { status: 204 });
    },
  });
  const reporter = new TestCraftReporter({
    env: {
      TESTCRAFT_API_URL: config.TESTCRAFT_API_URL,
      TESTCRAFT_RUN_ID: "run-id",
      TESTCRAFT_USERNAME: "user",
      TESTCRAFT_PASSWORD: "password",
      TESTCRAFT_PROJECT_NAME: "My Project",
      TESTCRAFT_KEYCLOAK_AUTHORITY: "https://auth.test/realms/test",
    },
  });
  reporter.onBegin();
  reporter.onStdOut("output\n");
  await reporter.onEnd();
  expect(calls[0].init?.body?.toString()).toContain("grant_type=password");
  expect(calls.at(-1)?.url).toContain(
    "/projects/found-project/runs/run-id/logs",
  );
  expect(warnings).toEqual([]);
});

test("reports incomplete configuration without making requests", async () => {
  const reporter = new TestCraftReporter({
    env: { TESTCRAFT_RUN_ID: "run-id" },
  });
  reporter.onBegin();
  reporter.onStdOut("output\n");
  await reporter.onEnd();
  expect(calls).toEqual([]);
  expect(warnings).toHaveLength(1);
  expect(warnings[0]).toContain("Incomplete reporter configuration");
});

test("log failures warn once and do not fail the test run or expose response bodies", async () => {
  Object.defineProperty(globalThis, "fetch", {
    value: async () => new Response("private response", { status: 503 }),
  });
  const reporter = new TestCraftReporter({ env: config });
  reporter.onBegin();
  reporter.onStdOut("one\n");
  reporter.onStdErr("two\n");
  await reporter.onEnd();
  expect(warnings).toHaveLength(1);
  expect(warnings[0]).toContain("Live log delivery failed");
  expect(warnings[0]).not.toContain("private response");
});

test("authentication failure disables logs without exposing credentials", async () => {
  Object.defineProperty(globalThis, "fetch", {
    value: async () => new Response("private auth response", { status: 401 }),
  });
  const reporter = new TestCraftReporter({
    env: {
      ...config,
      TESTCRAFT_TOKEN: undefined,
      TESTCRAFT_USERNAME: "user",
      TESTCRAFT_PASSWORD: "secret",
      TESTCRAFT_KEYCLOAK_AUTHORITY: "https://auth.test",
    },
  });
  reporter.onBegin();
  reporter.onStdOut("output\n");
  await reporter.onEnd();
  expect(warnings).toEqual([
    "[TestCraft] Reporter initialization failed; live logs are disabled.",
  ]);
});

test("reports test progress even when a test produces no console output", async () => {
  const reporter = new TestCraftReporter({ env: config });
  const testCase = {
    titlePath: () => ["", "chromium", "file.spec.ts", "works"],
  } as TestCase;
  reporter.onBegin();
  reporter.onTestBegin(testCase);
  reporter.onTestEnd(testCase, { status: "passed" } as TestResult);
  await reporter.onEnd();
  expect(calls.map((call) => JSON.parse(String(call.init?.body)))).toEqual([
    { lines: ["[running] chromium > file.spec.ts > works"] },
    { lines: ["[passed] chromium > file.spec.ts > works"] },
  ]);
});
