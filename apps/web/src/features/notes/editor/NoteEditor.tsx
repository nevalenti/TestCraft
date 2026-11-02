import type { OnMount } from "@monaco-editor/react";
import {
  type KeyboardEvent,
  lazy,
  type ReactNode,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

import { DEFAULT_NOTE_TITLE } from "@/features/notes/constants";
import {
  NoteEditorToolbar,
  type ViewMode,
} from "@/features/notes/editor/NoteEditorToolbar";
import { isProseLanguage } from "@/features/notes/editor/noteLanguages";
import {
  type NoteEditorValue,
  useNoteAutosave,
} from "@/features/notes/editor/useNoteAutosave";
import { cn } from "@/lib/cn";
import { readStorage, writeStorage } from "@/lib/storage";

export type { NoteEditorValue } from "@/features/notes/editor/useNoteAutosave";

const LazyCodeEditor = lazy(async () => {
  const module = await import("@/components/ui/CodeEditor");
  return { default: module.CodeEditor };
});

const LazyNoteMarkdown = lazy(async () => {
  const module = await import("@/features/notes/editor/NoteMarkdown");
  return { default: module.NoteMarkdown };
});

const VIEW_MODE_KEY = "testcraft:notes:view-mode";
const VIEW_MODES: Set<ViewMode> = new Set(["write", "split", "preview"]);

const readStoredViewMode = (): ViewMode => {
  const stored = readStorage(VIEW_MODE_KEY) as ViewMode | null;
  return stored && VIEW_MODES.has(stored) ? stored : "write";
};

interface NoteEditorProps {
  initialValue: NoteEditorValue;
  initialVersion?: number;
  onSave: Parameters<typeof useNoteAutosave>[1];
  isSaving?: boolean;
  readOnly?: boolean;
  onDelete?: () => void;
  updatedAt?: string;
  leading?: ReactNode;
}

export const NoteEditor = ({
  initialValue,
  initialVersion,
  onSave,
  isSaving,
  readOnly = false,
  onDelete,
  updatedAt,
  leading,
}: NoteEditorProps) => {
  const {
    value,
    setValue,
    save,
    hasTitle,
    isDirty,
    saveError,
    hasConflict,
    resolveConflict,
    saveInProgress,
  } = useNoteAutosave(initialValue, onSave, readOnly, initialVersion);
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    readOnly ? "preview" : readStoredViewMode(),
  );
  const titleRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const isFreshNote =
    !readOnly &&
    initialValue.title === DEFAULT_NOTE_TITLE &&
    initialValue.content === "";

  useEffect(() => {
    if (!isFreshNote) return;
    titleRef.current?.focus();
    titleRef.current?.select();
  }, [isFreshNote]);

  const isMarkdown = value.language === "markdown";
  const mode: ViewMode = isMarkdown ? viewMode : "write";
  const isShowSource = mode !== "preview";
  const isShowPreview = mode !== "write";

  const changeViewMode = (next: ViewMode) => {
    setViewMode(next);
    if (!readOnly) writeStorage(VIEW_MODE_KEY, next);
  };

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    editorRef.current?.focus();
  };

  const sourcePane = (
    <Suspense
      fallback={<div className="h-full animate-pulse bg-base-200/40" />}
    >
      <LazyCodeEditor
        value={value.content}
        language={value.language}
        onChange={(content) =>
          setValue((previous) => ({ ...previous, content }))
        }
        onMount={(editor) => {
          editorRef.current = editor;
        }}
        height="100%"
        readOnly={readOnly}
        variant={isProseLanguage(value.language) ? "prose" : "code"}
        transparent
        padding={{ top: 16, bottom: 16 }}
        className="h-full rounded-none border-0"
      />
    </Suspense>
  );

  const previewPane = (
    <div className="h-full overflow-y-auto px-6 py-5 lg:px-10">
      <Suspense fallback={null}>
        <LazyNoteMarkdown
          content={value.content}
          className="mx-auto max-w-4xl"
        />
      </Suspense>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <NoteEditorToolbar
        value={value}
        setValue={setValue}
        titleRef={titleRef}
        onTitleKeyDown={handleTitleKeyDown}
        readOnly={readOnly}
        mode={mode}
        onViewModeChange={changeViewMode}
        onRetrySave={() => save(value)}
        isSaving={isSaving ?? false}
        saveInProgress={saveInProgress}
        hasTitle={hasTitle}
        saveError={saveError}
        hasConflict={hasConflict}
        onResolveConflict={resolveConflict}
        isDirty={isDirty}
        onDelete={onDelete}
        updatedAt={updatedAt}
        leading={leading}
      />

      <div
        className={cn(
          "grid min-h-80 flex-1 grid-rows-[minmax(0,1fr)]",
          mode === "split" && "lg:grid-cols-2",
        )}
      >
        {isShowSource && <div className="min-h-0">{sourcePane}</div>}
        {isShowPreview && (
          <div
            className={cn(
              "min-h-0",
              mode === "split" && "hidden border-l border-border lg:block",
            )}
          >
            {previewPane}
          </div>
        )}
      </div>
    </div>
  );
};
