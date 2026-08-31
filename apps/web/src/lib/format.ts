import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';

const toDate = (value: unknown): Date | null => {
  if (value == null || value === '') return null;
  const date =
    typeof value === 'string' ? parseISO(value) : new Date(value as never);
  return isValid(date) ? date : null;
};

export const formatDate = (value: unknown): string => {
  const date = toDate(value);
  return date ? format(date, 'MMM d, yyyy') : '—';
};

export const formatDateTime = (value: unknown): string => {
  const date = toDate(value);
  return date ? format(date, 'MMM d, yyyy, h:mm:ss a') : '—';
};

export const toDatetimeLocal = (iso: string): string =>
  format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");

export const todayLocalDate = (): string => format(new Date(), 'yyyy-MM-dd');

export const formatElapsed = (value: unknown): string => {
  const date = toDate(value);
  return date ? formatDistanceToNowStrict(date) : '—';
};

export const formatDuration = (ms?: number | null): string => {
  if (ms == null) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
};

export const passRateClass = (rate: number): string => {
  if (rate >= 80) return 'text-success';
  if (rate >= 50) return 'text-warning';
  return 'text-error';
};

export const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const truncate = (text: string, maxLength: number): string =>
  text.length > maxLength ? text.slice(0, maxLength) + '…' : text;

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
