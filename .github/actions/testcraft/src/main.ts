import * as core from "@actions/core";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { fetchToken } from "./auth";
import {
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

const run = async (): Promise<void> => {
  const apiUrl = core.getInput("api-url");
  const junitXmlInput = core.getInput("junit-xml", { required: true });
  const username = core.getInput("username");
  const password = core.getInput("password");
  const projectName = core.getInput("project-name", { required: true });
  const runName = core.getInput("run-name", { required: true });
  const keycloakAuthority = core.getInput("keycloak-authority") || undefined;
  const source = core.getInput("source") || undefined;
  const screenshotsDirInput = core.getInput("screenshots-dir") || undefined;
  const workspace = process.env["GITHUB_WORKSPACE"] ?? process.cwd();
  const junitXml = resolve(workspace, junitXmlInput);

  if (!apiUrl) {
    core.info("api-url not set — skipping TestCraft import");
    return;
  }

  if (!existsSync(junitXml)) {
    throw new Error(`JUnit XML not found at ${junitXml}`);
  }

  if (!username || !password) {
    throw new Error("username and password are required when api-url is set");
  }

  let authority = keycloakAuthority;
  if (!authority) {
    core.info("Fetching auth config…");
    authority = await fetchAuthority(apiUrl);
  }
  core.info("Authenticating with Keycloak…");
  const token = await fetchToken(authority, username, password);
  core.info(`Resolving project "${projectName}"…`);
  const projectId = await findProjectId(apiUrl, token, projectName);
  core.info("Importing results…");

  const job = await importResults(
    apiUrl,
    projectId,
    token,
    runName,
    readFileSync(junitXml, "utf8"),
    source,
  );

  core.info("Waiting for import job to complete…");
  const runId = await pollJob(apiUrl, projectId, job.id, token);
  core.info("Results imported successfully");

  if (!screenshotsDirInput || !runId) return;

  const screenshotsDir = resolve(workspace, screenshotsDirInput);
  if (!existsSync(screenshotsDir)) {
    core.info(
      `Screenshots directory not found at ${screenshotsDir} — skipping attachments`,
    );
    return;
  }

  core.info("Uploading screenshots as attachments…");
  const results = await fetchAllResults(apiUrl, projectId, runId, token);

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
          runId,
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
