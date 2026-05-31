const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const DATETIME_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

export const formatDate = (value: string | Date): string =>
  new Date(value).toLocaleDateString(undefined, DATE_FORMAT);

export const formatDateTime = (value: string | Date): string =>
  new Date(value).toLocaleString(undefined, DATETIME_FORMAT);
