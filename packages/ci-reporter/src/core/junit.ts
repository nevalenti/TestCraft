import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const wildcardToRegExp = (pattern: string): RegExp => {
  const escaped = pattern
    .replaceAll(/[.+^${}()|[\]\\]/g, String.raw`\$&`)
    .replaceAll('*', '.*');
  return new RegExp(`^${escaped}$`);
};

const extractSuites = (xml: string): string => {
  const match = xml.match(/<testsuites[^>]*>([\s\S]*)<\/testsuites>/);
  return (match ? match[1] : xml.replace(/<\?xml[^>]*\?>/, '')).trim();
};

export const resolveJunitXml = (
  pattern: string,
  workspace: string,
): string | null => {
  const absolute = path.resolve(workspace, pattern);

  if (!absolute.includes('*')) {
    return existsSync(absolute) ? readFileSync(absolute, 'utf8') : null;
  }

  const dir = path.dirname(absolute);
  if (!existsSync(dir)) return null;

  const filePattern = wildcardToRegExp(absolute.slice(dir.length + 1));
  const files = readdirSync(dir)
    .filter((file) => filePattern.test(file))
    .toSorted((a, b) => a.localeCompare(b))
    .map((file) => path.join(dir, file));

  if (files.length === 0) return null;

  const suites = files.map((file) => extractSuites(readFileSync(file, 'utf8')));
  return `<?xml version="1.0" encoding="UTF-8"?><testsuites>${suites.join('\n')}</testsuites>`;
};
