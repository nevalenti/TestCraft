interface RunResultsBarProps {
  passed: number;
  failed: number;
}

export const RunResultsBar = ({ passed, failed }: RunResultsBarProps) => {
  const total = passed + failed;
  const passedPercent = total > 0 ? (passed / total) * 100 : 0;
  const failedPercent = total > 0 ? 100 - passedPercent : 0;

  return (
    <div className="flex h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-base-content/10">
      {passed > 0 && (
        <div
          className="h-full bg-success"
          style={{ width: `${passedPercent}%` }}
        />
      )}
      {failed > 0 && (
        <div
          className="h-full bg-error"
          style={{ width: `${failedPercent}%` }}
        />
      )}
    </div>
  );
};

export const ProgressBarSkeleton = () => (
  <div className="h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-base-content/10">
    <div className="h-full w-2/5 rounded-full bg-base-content/15 motion-safe:animate-pulse" />
  </div>
);
