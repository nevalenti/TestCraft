import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { isPreconditionFailed } from "@/api/ifMatch";
import { useDebounce } from "@/hooks/useDebounce";

export interface NoteEditorValue {
  title: string;
  language: string;
  content: string;
}

const isSameValue = (first: NoteEditorValue, second: NoteEditorValue) =>
  first.title === second.title &&
  first.language === second.language &&
  first.content === second.content;

interface SaveRequest {
  value: NoteEditorValue;
  onSave: (
    value: NoteEditorValue,
    version: number | undefined,
  ) => Promise<void | { version: number }> | void;
}

export const useNoteAutosave = (
  serverValue: NoteEditorValue,
  onSave: SaveRequest["onSave"],
  isReadOnly = false,
  serverVersion?: number,
) => {
  const [value, setValue] = useState(serverValue);
  const [confirmedValue, setConfirmedValue] = useState(serverValue);
  const [saveError, setSaveError] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const debouncedValue = useDebounce(value, 800);
  const lastSaved = useRef(serverValue);
  const savedVersion = useRef(serverVersion);
  const latest = useRef({
    value,
    onSave,
    isReadOnly,
    serverValue,
    serverVersion,
  });
  const queued = useRef<SaveRequest | null>(null);
  const saving = useRef(false);
  const conflicted = useRef(false);
  const mounted = useRef(false);

  useLayoutEffect(() => {
    latest.current = { value, onSave, isReadOnly, serverValue, serverVersion };
  });

  const recordFailure = useCallback((error: unknown) => {
    const isConflict = isPreconditionFailed(error);
    if (isConflict) conflicted.current = true;
    if (!mounted.current) return;
    if (isConflict) setHasConflict(true);
    else setSaveError(true);
  }, []);

  const save = useCallback(
    (next: NoteEditorValue) => {
      if (
        latest.current.isReadOnly ||
        conflicted.current ||
        !next.title.trim()
      ) {
        queued.current = null;
        return;
      }

      queued.current = { value: next, onSave: latest.current.onSave };
      if (saving.current) return;
      if (isSameValue(next, lastSaved.current)) {
        queued.current = null;
        if (mounted.current) setSaveError(false);
        return;
      }

      saving.current = true;
      if (mounted.current) setSaveInProgress(true);
      void (async () => {
        while (queued.current && !latest.current.isReadOnly) {
          const request = queued.current;
          queued.current = null;
          if (isSameValue(request.value, lastSaved.current)) continue;
          try {
            const saved = await request.onSave(
              request.value,
              savedVersion.current,
            );
            if (saved) savedVersion.current = saved.version;
            lastSaved.current = request.value;
            if (mounted.current) {
              setConfirmedValue(request.value);
              setSaveError(false);
            }
          } catch (error) {
            recordFailure(error);
            break;
          }
        }
        saving.current = false;
        if (mounted.current) setSaveInProgress(false);
      })();
    },
    [recordFailure],
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      save(latest.current.value);
    };
  }, [save]);

  useEffect(() => {
    save(debouncedValue);
  }, [debouncedValue, isReadOnly, save]);

  useEffect(() => {
    if (isReadOnly) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isSameValue(latest.current.value, lastSaved.current)) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s")
        return;
      event.preventDefault();
      save(latest.current.value);
    };
    addEventListener("beforeunload", warnBeforeUnload);
    addEventListener("keydown", handleKeyDown);
    return () => {
      removeEventListener("beforeunload", warnBeforeUnload);
      removeEventListener("keydown", handleKeyDown);
    };
  }, [isReadOnly, save]);

  const resolveConflict = (keep: "mine" | "theirs") => {
    const { serverValue: theirs, serverVersion: version } = latest.current;
    savedVersion.current = version;
    conflicted.current = false;
    setHasConflict(false);
    if (keep === "mine") {
      save(latest.current.value);
      return;
    }
    lastSaved.current = theirs;
    setValue(theirs);
    setConfirmedValue(theirs);
    setSaveError(false);
  };

  return {
    value,
    setValue,
    save,
    saveError,
    hasConflict,
    resolveConflict,
    saveInProgress,
    isDirty: !isSameValue(value, confirmedValue),
    hasTitle: value.title.trim() !== "",
  };
};
