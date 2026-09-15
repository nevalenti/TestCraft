const CI_RUN_NAME_PATTERN = /^#\d+\s+(\S+)\s+\(([^)]+)\)$/;
const PR_MERGE_REF_PATTERN = /^(\d+)\/merge$/;

export const formatCiRunName = (name: string): string => {
  const match = CI_RUN_NAME_PATTERN.exec(name);
  if (!match) return name;

  const [, workflow, ref] = match;
  const prMatch = PR_MERGE_REF_PATTERN.exec(ref);
  const refLabel = prMatch ? `PR #${prMatch[1]}` : ref;

  return `${workflow} · ${refLabel}`;
};
