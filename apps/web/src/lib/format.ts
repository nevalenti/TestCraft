import { format, isValid, parseISO } from "date-fns";

const toDate = (value: unknown): Date | null => {
  if (value == null || value === "") return null;
  const d =
    typeof value === "string" ? parseISO(value) : new Date(value as never);
  return isValid(d) ? d : null;
};

export const formatDate = (value: unknown): string => {
  const d = toDate(value);
  return d ? format(d, "MMM d, yyyy") : "—";
};

export const formatDateTime = (value: unknown): string => {
  const d = toDate(value);
  return d ? format(d, "MMM d, yyyy, h:mm a") : "—";
};

export const toDatetimeLocal = (iso: string): string =>
  format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
