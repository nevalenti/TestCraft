import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/api/queryKeys';

describe('queryKeys', () => {
  describe('projects', () => {
    it('all is a stable constant', () => {
      expect(queryKeys.projects.all).toEqual(['projects']);
    });

    it('detail returns a key containing the id', () => {
      expect(queryKeys.projects.detail('proj-1')).toEqual([
        'projects',
        'proj-1',
      ]);
    });
  });

  describe('testSuites', () => {
    it('all scopes by projectId', () => {
      expect(queryKeys.testSuites.all('proj-1')).toEqual([
        'projects',
        'proj-1',
        'suites',
      ]);
    });

    it('detail scopes by projectId and suite id', () => {
      expect(queryKeys.testSuites.detail('proj-1', 'suite-1')).toEqual([
        'projects',
        'proj-1',
        'suites',
        'suite-1',
      ]);
    });
  });

  describe('testCases', () => {
    it('all scopes by projectId and suiteId', () => {
      expect(queryKeys.testCases.all('proj-1', 'suite-1')).toEqual([
        'projects',
        'proj-1',
        'suites',
        'suite-1',
        'cases',
      ]);
    });

    it('detail scopes by projectId, suiteId, and case id', () => {
      expect(queryKeys.testCases.detail('proj-1', 'suite-1', 'case-1')).toEqual(
        ['projects', 'proj-1', 'suites', 'suite-1', 'cases', 'case-1'],
      );
    });

    it('byProject scopes by projectId only', () => {
      expect(queryKeys.testCases.byProject('proj-1')).toEqual([
        'projects',
        'proj-1',
        'cases',
      ]);
    });
  });

  describe('testCaseSteps', () => {
    it('all scopes by projectId, suiteId, and caseId', () => {
      expect(
        queryKeys.testCaseSteps.all('proj-1', 'suite-1', 'case-1'),
      ).toEqual([
        'projects',
        'proj-1',
        'suites',
        'suite-1',
        'cases',
        'case-1',
        'steps',
      ]);
    });

    it('detail scopes by all four ids', () => {
      expect(
        queryKeys.testCaseSteps.detail('proj-1', 'suite-1', 'case-1', 'step-1'),
      ).toEqual([
        'projects',
        'proj-1',
        'suites',
        'suite-1',
        'cases',
        'case-1',
        'steps',
        'step-1',
      ]);
    });
  });

  describe('testRuns', () => {
    it('all scopes by projectId', () => {
      expect(queryKeys.testRuns.all('proj-1')).toEqual([
        'projects',
        'proj-1',
        'runs',
      ]);
    });

    it('detail scopes by projectId and run id', () => {
      expect(queryKeys.testRuns.detail('proj-1', 'run-1')).toEqual([
        'projects',
        'proj-1',
        'runs',
        'run-1',
      ]);
    });
  });

  describe('testResults', () => {
    it('all scopes by projectId and runId', () => {
      expect(queryKeys.testResults.all('proj-1', 'run-1')).toEqual([
        'projects',
        'proj-1',
        'runs',
        'run-1',
        'results',
      ]);
    });

    it('detail scopes by projectId, runId, and result id', () => {
      expect(
        queryKeys.testResults.detail('proj-1', 'run-1', 'result-1'),
      ).toEqual(['projects', 'proj-1', 'runs', 'run-1', 'results', 'result-1']);
    });
  });

  describe('key uniqueness — different entities produce different keys', () => {
    it('projects.all differs from testSuites.all', () => {
      expect(queryKeys.projects.all).not.toEqual(queryKeys.testSuites.all('p'));
    });

    it('testRuns.all and testSuites.all differ for the same projectId', () => {
      expect(queryKeys.testRuns.all('proj-1')).not.toEqual(
        queryKeys.testSuites.all('proj-1'),
      );
    });
  });
});
