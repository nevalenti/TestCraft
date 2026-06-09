import * as core from "@actions/core";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fetchToken } from "./auth";
import { importResults } from "./testcraft";
import { fetchAuthority, findProjectId } from "./util";

const run = async (): Promise<void> => {
  const apiUrl = core.getInput("api-url");
  const junitXmlInput = core.getInput("junit-xml", { required: true });
  const username = core.getInput("username");
  const password = core.getInput("password");
  const projectName = core.getInput("project-name", { required: true });
  const runName = core.getInput("run-name", { required: true });
  const keycloakAuthority = core.getInput("keycloak-authority") || undefined;
  const source = core.getInput("source") || undefined;
  const junitXml = resolve(
    process.env["GITHUB_WORKSPACE"] ?? process.cwd(),
    junitXmlInput,
  );

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

  await importResults(
    apiUrl,
    projectId,
    token,
    runName,
    readFileSync(junitXml, "utf8"),
    source,
  );
  core.info("Results imported successfully");
};

run().catch(core.setFailed);
