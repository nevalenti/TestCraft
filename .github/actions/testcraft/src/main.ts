import * as core from "@actions/core";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

import { fetchToken } from "./auth";
import {
  createRun,
  fetchAllResults,
  importResults,
  pollJob,
  uploadAttachment,
} from "./testcraft";
import { fetchAuthority, findProjectId } from "./util";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Scoped to this workflow run + job so parallel jobs don't collide.
const stateFile = join(
  process.env["RUNNER_TEMP"] ?? tmpdir(),
  `.testcraft_${process.env["GITHUB_RUN_ID"] ?? "local"}_${process.env["GITHUB_JOB"] ?? "job"}.run_id`,
);

const readState = (): string | null => {
  if (!existsSync(stateFile)) return null;
  return readFileSync(stateFile, "utf8").trim() || null;
};

const authenticate = async (
  apiUrl: string,
  username: string,
  password: string,
  keycloakAuthority?: string,
): Promise<string> => {
  let authority = keycloakAuthority;
  if (!authority) {
    core.info("Fetching auth config…");
    authority = await fetchAuthority(apiUrl);
  }
  core.info("Authenticating with Keycloak…");
  return fetchToken(authority, username, password);
};

const run = async (): Promise<void> => {
  const command = core.getInput("command") || "import";
  const apiUrl = core.getInput("api-url");
  const username = core.getInput("username");
  const password = core.getInput("password");
  const projectName = core.getInput("project-name", { required: true });
  const runName = core.getInput("run-name", { required: true });
  const keycloakAuthority = core.getInput("keycloak-authority") || undefined;
  const source = core.getInput("source") || undefined;
  const workspace = process.env["GITHUB_WORKSPACE"] ?? process.cwd();

  if (!apiUrl) {
    core.info("api-url not set — skipping TestCraft");
    return;
  }

  if (!username || !password) {
    throw new Error("username and password are required when api-url is set");
  }

  // ── start ─────────────────────────────────────────────────────────────────
  // Create an Active run before tests begin. The run ID is saved to a temp
  // file so the subsequent import step can append results to the same run.
  if (command === "start") {
    const token = await authenticate(
      apiUrl,
      username,
      password,
      keycloakAuthority,
    );
    core.info(`Resolving project "${projectName}"…`);
    const projectId = await findProjectId(apiUrl, token, projectName);

    core.info("Creating Active run…");
    const activeRun = await createRun(
      apiUrl,
      projectId,
      token,
      runName,
      "ci",
      source,
    );
    writeFileSync(stateFile, activeRun.id, "utf8");
    core.setOutput("run-id", activeRun.id);
    core.info(`Run ${activeRun.id} is now Active`);
    return;
  }

  // ── import ────────────────────────────────────────────────────────────────
  const junitXmlInput = core.getInput("junit-xml");
  if (!junitXmlInput) {
    throw new Error("junit-xml is required when command is import");
  }
  const junitXml = resolve(workspace, junitXmlInput);

  const token = await authenticate(
    apiUrl,
    username,
    password,
    keycloakAuthority,
  );
  core.info(`Resolving project "${projectName}"…`);
  const projectId = await findProjectId(apiUrl, token, projectName);

  if (!existsSync(junitXml)) {
    const savedRunId = readState();
    if (savedRunId) {
      // Tests never ran (e.g. lint/build failed) but a run was already created
      // as Active. Complete it with zero results so it doesn't stay stuck.
      core.info(
        `JUnit XML not found — completing run ${savedRunId} with no results`,
      );
      const emptyXml =
        '<?xml version="1.0" encoding="UTF-8"?><testsuites name="empty" tests="0"/>';
      const job = await importResults(
        apiUrl,
        projectId,
        token,
        runName,
        emptyXml,
        source,
        savedRunId,
      );
      await pollJob(apiUrl, projectId, job.id, token);
      writeFileSync(stateFile, "", "utf8");
    } else {
      core.warning(`JUnit XML not found at ${junitXml} — skipping import`);
    }
    return;
  }

  // Use the run created by the start step, or create one now if start wasn't called.
  const savedRunId = readState();
  if (savedRunId) {
    core.info(`Appending results to existing run ${savedRunId}…`);
  } else {
    core.info("No pre-created run found — creating Active run for import…");
  }

  core.info("Importing results…");
  const job = await importResults(
    apiUrl,
    projectId,
    token,
    runName,
    readFileSync(junitXml, "utf8"),
    source,
    savedRunId ?? undefined,
  );

  core.info("Waiting for import job to complete…");
  const completedRunId = await pollJob(apiUrl, projectId, job.id, token);
  core.setOutput("run-id", completedRunId ?? "");
  core.info("Results imported successfully");

  // Clear state so a re-run of the same job doesn't reuse a stale run ID.
  writeFileSync(stateFile, "", "utf8");

  const screenshotsDirInput = core.getInput("screenshots-dir") || undefined;
  if (!screenshotsDirInput || !completedRunId) return;

  const screenshotsDir = resolve(workspace, screenshotsDirInput);
  if (!existsSync(screenshotsDir)) {
    core.info(
      `Screenshots directory not found at ${screenshotsDir} — skipping attachments`,
    );
    return;
  }

  core.info("Uploading screenshots as attachments…");
  const results = await fetchAllResults(
    apiUrl,
    projectId,
    completedRunId,
    token,
  );

  let uploaded = 0;
  for (const result of results) {
    const slug = slugify(result.testCaseName);
    const matchingDirs = readdirSync(screenshotsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.toLowerCase().includes(slug))
      .map((d) => join(screenshotsDir, d.name));

    for (const dir of matchingDirs) {
      const pngs = readdirSync(dir)
        .filter((f) => f.endsWith(".png"))
        .map((f) => join(dir, f));

      for (const png of pngs) {
        await uploadAttachment(
          apiUrl,
          projectId,
          completedRunId,
          result.id,
          token,
          png,
          basename(png),
        );
        uploaded++;
      }
    }
  }

  core.info(`Uploaded ${uploaded} screenshot(s)`);
};

run().catch(core.setFailed);
