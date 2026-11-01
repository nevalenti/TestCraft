import type { Note } from "@testcraft/types";
import {
  differenceInCalendarDays,
  format,
  isSameYear,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";

export interface NoteGroup {
  label: string;
  notes: Note[];
}

const groupLabel = (date: Date, now: Date) => {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  const days = differenceInCalendarDays(now, date);
  if (days < 7) return "Previous 7 days";
  if (days < 30) return "Previous 30 days";
  if (isSameYear(date, now)) return format(date, "MMMM");

  return format(date, "yyyy");
};

export const groupNotesByRecency = (
  notes: Note[],
  now = new Date(),
): NoteGroup[] => {
  const groups: NoteGroup[] = [];
  for (const note of notes) {
    const label = groupLabel(parseISO(note.updated_at), now);
    const current = groups.at(-1);
    if (current?.label === label) current.notes.push(note);
    else groups.push({ label, notes: [note] });
  }

  return groups;
};

export const latestNote = (notes: Note[]): Note | undefined =>
  notes.toSorted((first, second) =>
    second.updated_at.localeCompare(first.updated_at),
  )[0];
