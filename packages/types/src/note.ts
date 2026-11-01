import type { components } from "./generated/schema.js";

export type Note = components["schemas"]["NoteResponse"];
export type NoteDetail = components["schemas"]["NoteDetailResponse"];
export type CreatePersonalNote = components["schemas"]["CreateNoteRequest"];
export type UpdatePersonalNote = components["schemas"]["UpdateNoteRequest"];
export type CreateProjectNote = components["schemas"]["CreateNoteRequest"];
export type UpdateProjectNote = components["schemas"]["UpdateNoteRequest"];
