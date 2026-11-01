import type { TestResult, TestResultStatus } from "@testcraft/types";
import { type ReactNode, useMemo } from "react";

import { useAllTestResults } from "@/features/testResults/hooks";
import { ResultsBySuite } from "@/features/testResults/ResultsBySuite";
import { useTestSuites } from "@/features/testSuites/hooks";

interface GroupedResultsProps {
  projectId: string;
  runId: string;
  status?: TestResultStatus;
  search?: string;
  onEdit?: (result: TestResult) => void;
  onDelete?: (result: TestResult) => void;
  onAttachment: (result: TestResult) => void;
  fallback: ReactNode;
}

export const GroupedResults = ({
  projectId,
  runId,
  status,
  search,
  onEdit,
  onDelete,
  onAttachment,
  fallback,
}: GroupedResultsProps) => {
  const { data: results } = useAllTestResults(projectId, runId, status, search);
  const { data: suites } = useTestSuites(projectId);
  const suiteNames = useMemo(
    () => new Map((suites ?? []).map((suite) => [suite.id, suite.name])),
    [suites],
  );

  if (!results?.length) return fallback;

  return (
    <ResultsBySuite
      results={results}
      suiteNames={suiteNames}
      onEdit={onEdit}
      onDelete={onDelete}
      onAttachment={onAttachment}
    />
  );
};
