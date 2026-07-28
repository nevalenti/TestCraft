import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const wildcardToRegExp = (pattern: string): RegExp =>
  new RegExp(
    `^${pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`,
  );

const extractSuites = (xml: string): string => {
  const match = xml.match(/<testsuites[^>]*>([\s\S]*)<\/testsuites>/);
  return (match ? match[1] : xml.replace(/<\?xml[^>]*\?>/, '')).trim();
};

export const resolveJunitXml = (
  pattern: string,
  workspace: string,
): string | null => {
  const absolute = resolve(workspace, pattern);

  if (!absolute.includes('*')) {
    return existsSync(absolute) ? readFileSync(absolute, 'utf8') : null;
  }

  const dir = dirname(absolute);
  if (!existsSync(dir)) return null;

  const filePattern = wildcardToRegExp(absolute.slice(dir.length + 1));
  const files = readdirSync(dir)
    .filter((file) => filePattern.test(file))
    .sort()
    .map((file) => join(dir, file));

  if (files.length === 0) return null;

  const suites = files.map((file) => extractSuites(readFileSync(file, 'utf8')));
  return `<?xml version="1.0" encoding="UTF-8"?><testsuites>${suites.join('\n')}</testsuites>`;
};
