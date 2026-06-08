import * as core from "@actions/core";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fetchToken } from "./auth";
import { importResults } from "./testcraft";

const run = async (): Promise<void> => {
  const apiUrl = core.getInput("api-url");
  const junitXmlInput = core.getInput("junit-xml", { required: true });
  const keycloakAuthority = core.getInput("keycloak-authority");
  const username = core.getInput("username");
  const password = core.getInput("password");
  const projectId = core.getInput("project-id");
  const runName = core.getInput("run-name", { required: true });
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

  if (!keycloakAuthority || !username || !password || !projectId) {
    throw new Error(
      "keycloak-authority, username, password, and project-id are required when api-url is set",
    );
  }

  core.info("Authenticating with Keycloak…");
  const token = await fetchToken(keycloakAuthority, username, password);
  core.info("Authenticated. Importing results…");

  await importResults(
    apiUrl,
    projectId,
    token,
    runName,
    readFileSync(junitXml, "utf8"),
  );
  core.info("Results imported successfully");
};

run().catch(core.setFailed);
