const PALETTE = [
  '#818cf8',
  '#36d399',
  '#f97316',
  '#f43f5e',
  '#facc15',
  '#22d3ee',
  '#a78bfa',
];

const MANUAL_COLOR = '#94a3b8';

export const sourceLabel = (source: string | undefined) =>
  source ? source.charAt(0).toUpperCase() + source.slice(1) : 'Manual';

export const sourceColor = (source: string | undefined, index: number) =>
  source ? (PALETTE[index % PALETTE.length] ?? PALETTE[0]) : MANUAL_COLOR;

export const gradientId = (source: string | undefined) =>
  `trendGrad-${source ?? 'manual'}`;

export const deltaClass = (delta: number) => {
  if (delta > 0) return 'text-success';
  if (delta < 0) return 'text-error';
  return 'text-base-content/65';
};

export const deltaLabel = (delta: number | null) => {
  if (delta === null) return 'Not enough data';
  if (delta > 0) return 'Improving';
  if (delta < 0) return 'Declining';
  return 'Unchanged';
};

export type TrendEntry = {
  name: string;
  fullName: string;
  date: string;
  passRate: number;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  total: number;
};

export type SourceGroup = {
  source: string | undefined;
  data: TrendEntry[];
  index: number;
};
