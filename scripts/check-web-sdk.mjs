import { format } from "prettier";

import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const web = path.join(root, "apps/web");
const temporary = await mkdtemp(path.join(tmpdir(), "testcraft-sdk-"));
const output = path.join(temporary, "generated");
async function entries(directory) {
  const children = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      children.map(async (child) =>
        child.isDirectory()
          ? (await entries(path.join(directory, child.name))).map((name) =>
              path.join(child.name, name),
            )
          : [child.name],
      ),
    )
  )
    .flat()
    .sort();
}
try {
  const result = spawnSync(
    path.join(web, "node_modules/.bin/openapi-ts"),
    ["-o", output],
    { cwd: web, stdio: "inherit" },
  );
  if (result.status !== 0) throw new Error("SDK generation failed");
  const committed = path.join(web, "src/api/generated");
  const files = await entries(output);
  if (JSON.stringify(files) !== JSON.stringify(await entries(committed)))
    throw new Error("SDK file list is stale");
  for (const file of files) {
    const [expected, actual] = await Promise.all([
      readFile(path.join(output, file)),
      readFile(path.join(committed, file)),
    ]);
    if (
      (await format(expected.toString(), { parser: "typescript" })) !==
      (await format(actual.toString(), { parser: "typescript" }))
    )
      throw new Error(
        `SDK is stale: ${file}. Run pnpm --filter testcraft-web generate:sdk.`,
      );
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
