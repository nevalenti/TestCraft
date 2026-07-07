import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const wildcardToRegExp = (pattern: string): RegExp =>
  new RegExp(
    `^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`,
  );

const extractSuites = (xml: string): string => {
  const match = xml.match(/<testsuites[^>]*>([\s\S]*)<\/testsuites>/);
  return (match ? match[1] : xml.replace(/<\?xml[^>]*\?>/, "")).trim();
};

/**
 * Resolves a junit-xml input to its combined XML content. Accepts either a
 * literal file path, or a single-directory glob such as
 * "dir/*.junit.xml" — dotnet test writes one report per test project with
 * no built-in way to merge them, so multiple matches are combined into one
 * <testsuites> document.
 */
export const resolveJunitXml = (
  pattern: string,
  workspace: string,
): string | null => {
  const absolute = resolve(workspace, pattern);

  if (!absolute.includes("*")) {
    return existsSync(absolute) ? readFileSync(absolute, "utf8") : null;
  }

  const dir = dirname(absolute);
  if (!existsSync(dir)) return null;

  const filePattern = wildcardToRegExp(absolute.slice(dir.length + 1));
  const files = readdirSync(dir)
    .filter((f) => filePattern.test(f))
    .sort()
    .map((f) => join(dir, f));

  if (files.length === 0) return null;

  const suites = files.map((f) => extractSuites(readFileSync(f, "utf8")));
  return `<?xml version="1.0" encoding="UTF-8"?><testsuites>${suites.join("\n")}</testsuites>`;
};
