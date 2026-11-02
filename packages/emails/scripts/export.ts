import { readFile, writeFile } from "node:fs/promises";

import { render } from "react-email";
import { createElement } from "react";

import RunCompleted from "../emails/run-completed";

const destination = new URL(
  "../../../apps/Api/src/TestCraft.Infrastructure/Notifications/Templates/run_completed.html",
  import.meta.url,
);
const html =
  `${await render(createElement(RunCompleted, { runName: "{{run_name}}", runUrl: "https://testcraft-template.invalid/run" }))}\n`.replaceAll(
    "https://testcraft-template.invalid/run",
    "{{run_url}}",
  );

if (process.argv.includes("--check")) {
  if ((await readFile(destination, "utf8")) !== html) {
    throw new Error(
      "Email HTML is stale. Run pnpm --filter @testcraft/emails build.",
    );
  }
} else {
  await writeFile(destination, html);
}
