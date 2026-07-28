import { format, isValid, parseISO } from 'date-fns';

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

export const formatDuration = (ms?: number | null): string => {
  if (ms == null) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
};
