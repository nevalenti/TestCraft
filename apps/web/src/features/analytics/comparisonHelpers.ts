export const STATUS_BADGE: Record<string, string> = {
  Passed: 'badge-success',
  Failed: 'badge-error',
  Blocked: 'badge-warning',
  Skipped: 'badge-ghost',
};

export const rowBg = (isRegression: boolean, isFix: boolean) => {
  if (isRegression) return 'bg-error/5';
  if (isFix) return 'bg-success/5';
  return '';
};
