import { format } from "date-fns";

export const formatDate = (value: string | Date): string =>
  format(new Date(value), "MMM d, yyyy");

export const formatDateTime = (value: string | Date): string =>
  format(new Date(value), "MMM d, yyyy, h:mm a");

export const toDatetimeLocal = (iso: string): string =>
  format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
