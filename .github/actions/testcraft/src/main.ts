import * as core from "@actions/core";
import { existsSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import {
  ApiContext,
  createRun,
  createStateStore,
  fetchAllResults,
  fetchAuthority,
  fetchToken,
  findProjectId,
  importResults,
  pollJob,
  slugify,
  uploadAttachment,
} from "@testcraft/ci-reporter";

import { resolveJunitXml } from "./junit";

const { readState, saveState, clearState } = createStateStore(
  `${process.env["GITHUB_RUN_ID"] ?? "local"}_${process.env["GITHUB_JOB"] ?? "job"}`,
);

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
  const token = await fetchToken(authority, username, password);
  core.setSecret(token);
  return token;
};

const buildContext = async (
  apiUrl: string,
  username: string,
  password: string,
  projectName: string,
  keycloakAuthority?: string,
): Promise<ApiContext> => {
  const token = await authenticate(
    apiUrl,
    username,
    password,
    keycloakAuthority,
  );
  core.info(`Resolving project "${projectName}"…`);
  const projectId = await findProjectId(apiUrl, token, projectName);
  return { apiUrl, projectId, token };
};

const handleStart = async (
  ctx: ApiContext,
  runName: string,
  source?: string,
): Promise<void> => {
  core.info("Creating Active run…");
  const activeRun = await createRun(ctx, runName, "ci", source);
  saveState(activeRun.id);
  core.setOutput("run-id", activeRun.id);
  core.info(`Run ${activeRun.id} is now Active`);
};

const uploadScreenshots = async (
  ctx: ApiContext,
  runId: string,
  screenshotsDir: string,
): Promise<void> => {
  core.info("Uploading screenshots as attachments…");
  const results = await fetchAllResults(ctx, runId);

  let uploaded = 0;
  for (const result of results) {
    const slug = slugify(result.testCaseName);
    const pngs = readdirSync(screenshotsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.toLowerCase().includes(slug))
      .flatMap((d) =>
        readdirSync(join(screenshotsDir, d.name))
          .filter((f) => f.endsWith(".png"))
          .map((f) => join(screenshotsDir, d.name, f)),
      );

    for (const png of pngs) {
      await uploadAttachment(ctx, runId, result.id, png, basename(png));
      uploaded++;
    }
  }

  core.info(`Uploaded ${uploaded} screenshot(s)`);
};

const handleImport = async (
  ctx: ApiContext,
  runName: string,
  junitXmlPattern: string,
  workspace: string,
  source?: string,
  screenshotsDir?: string,
): Promise<void> => {
  const savedRunId = readState();
  const junitXml = resolveJunitXml(junitXmlPattern, workspace);

  if (!junitXml) {
    if (savedRunId) {
      core.info(
        `JUnit XML not found — completing run ${savedRunId} with no results`,
      );
      const emptyXml =
        '<?xml version="1.0" encoding="UTF-8"?><testsuites name="empty" tests="0"/>';
      const job = await importResults(
        ctx,
        runName,
        emptyXml,
        source,
        savedRunId,
      );
      await pollJob(ctx, job.id);
      clearState();
    } else {
      core.warning(
        `JUnit XML not found at ${junitXmlPattern} — skipping import`,
      );
    }
    return;
  }

  if (savedRunId) {
    core.info(`Appending results to existing run ${savedRunId}…`);
  } else {
    core.info("No pre-created run found — creating Active run for import…");
  }

  core.info("Importing results…");
  const job = await importResults(
    ctx,
    runName,
    junitXml,
    source,
    savedRunId ?? undefined,
  );

  core.info("Waiting for import job to complete…");
  const completedRunId = await pollJob(ctx, job.id);
  core.setOutput("run-id", completedRunId ?? "");
  core.info("Results imported successfully");

  clearState();

  if (!screenshotsDir || !completedRunId) return;

  if (!existsSync(screenshotsDir)) {
    core.info(
      `Screenshots directory not found at ${screenshotsDir} — skipping attachments`,
    );
    return;
  }

  await uploadScreenshots(ctx, completedRunId, screenshotsDir);
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

  const ctx = await buildContext(
    apiUrl,
    username,
    password,
    projectName,
    keycloakAuthority,
  );

  if (command === "start") {
    await handleStart(ctx, runName, source);
    return;
  }

  const junitXmlInput = core.getInput("junit-xml");
  if (!junitXmlInput) {
    throw new Error("junit-xml is required when command is import");
  }

  const screenshotsDirInput = core.getInput("screenshots-dir") || undefined;
  await handleImport(
    ctx,
    runName,
    junitXmlInput,
    workspace,
    source,
    screenshotsDirInput ? resolve(workspace, screenshotsDirInput) : undefined,
  );
};

run().catch(core.setFailed);
