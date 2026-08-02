import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveJunitXml } from '../core/junit';

describe('resolveJunitXml', () => {
  let workspace: string;

  beforeEach(() => {
    workspace = mkdtempSync(path.join(tmpdir(), 'ci-reporter-junit-'));
  });

  afterEach(() => {
    rmSync(workspace, { recursive: true, force: true });
  });

  describe('resolveJunitXml — given a literal path to an existing file — returns its contents', () => {
    it('reads the file verbatim', () => {
      const xml = '<testsuites><testsuite name="A" /></testsuites>';
      writeFileSync(path.join(workspace, 'results.xml'), xml, 'utf8');

      expect(resolveJunitXml('results.xml', workspace)).toBe(xml);
    });
  });

  describe('resolveJunitXml — given a literal path to a missing file — returns null', () => {
    it('does not throw', () => {
      expect(resolveJunitXml('missing.xml', workspace)).toBeNull();
    });
  });

  describe('resolveJunitXml — given a glob pattern matching no files — returns null', () => {
    it('returns null when the directory exists but nothing matches', () => {
      writeFileSync(path.join(workspace, 'unrelated.txt'), 'x', 'utf8');
      expect(resolveJunitXml('*.junit.xml', workspace)).toBeNull();
    });

    it('returns null when the directory itself does not exist', () => {
      expect(resolveJunitXml('nested/*.junit.xml', workspace)).toBeNull();
    });
  });

  describe('resolveJunitXml — given a glob pattern matching a single file — returns its suites wrapped in <testsuites>', () => {
    it("unwraps and rewraps the single file's suites", () => {
      writeFileSync(
        path.join(workspace, 'a.junit.xml'),
        '<?xml version="1.0"?><testsuites><testsuite name="A"><testcase name="t1" /></testsuite></testsuites>',
        'utf8',
      );

      const result = resolveJunitXml('*.junit.xml', workspace);

      expect(result).toContain('<testsuites>');
      expect(result).toContain('<testsuite name="A">');
      expect(result).toContain('<testcase name="t1" />');
    });
  });

  describe('resolveJunitXml — given a glob pattern matching multiple files — merges them into one <testsuites> document, sorted by filename', () => {
    it('combines suites from every matching file in filename order', () => {
      writeFileSync(
        path.join(workspace, 'b.junit.xml'),
        '<testsuites><testsuite name="B" /></testsuites>',
        'utf8',
      );
      writeFileSync(
        path.join(workspace, 'a.junit.xml'),
        '<testsuites><testsuite name="A" /></testsuites>',
        'utf8',
      );

      const result = resolveJunitXml('*.junit.xml', workspace);

      expect(result).not.toBeNull();
      const indexA = result!.indexOf('<testsuite name="A" />');
      const indexB = result!.indexOf('<testsuite name="B" />');
      expect(indexA).toBeGreaterThan(-1);
      expect(indexB).toBeGreaterThan(indexA);
    });

    it('ignores files that do not match the wildcard', () => {
      writeFileSync(
        path.join(workspace, 'a.junit.xml'),
        '<testsuites><testsuite name="A" /></testsuites>',
        'utf8',
      );
      writeFileSync(
        path.join(workspace, 'a.other.xml'),
        '<testsuites />',
        'utf8',
      );

      const result = resolveJunitXml('*.junit.xml', workspace);

      expect(result).toContain('<testsuite name="A" />');
      expect(result!.match(/<testsuite name=/g) ?? []).toHaveLength(1);
    });
  });

  describe('resolveJunitXml — given a file without a <testsuites> wrapper — strips only the XML declaration', () => {
    it('falls back to trimming the raw content for a single glob match', () => {
      writeFileSync(
        path.join(workspace, 'a.junit.xml'),
        '<?xml version="1.0"?><testsuite name="A" />',
        'utf8',
      );

      const result = resolveJunitXml('*.junit.xml', workspace);

      expect(result).toBe(
        '<?xml version="1.0" encoding="UTF-8"?><testsuites><testsuite name="A" /></testsuites>',
      );
    });
  });
});
