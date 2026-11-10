interface NoteEditorStatusBarProps {
  readOnly: boolean;
  line: number;
  column: number;
  language: string;
  showCursor: boolean;
}

export const NoteEditorStatusBar = ({
  readOnly,
  line,
  column,
  language,
  showCursor,
}: NoteEditorStatusBarProps) => (
  <footer className="flex h-8 shrink-0 items-center gap-4 border-t border-border px-3 text-xs text-fg-subtle lg:px-5">
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={
          readOnly
            ? "size-1.5 rounded-full bg-base-content/30"
            : "size-1.5 rounded-full bg-primary"
        }
      />
      {readOnly ? "Read only" : "Autosave on"}
    </span>
    <span className="flex-1" />
    {showCursor && (
      <span className="tabular-nums">
        Ln {line}, Col {column}
      </span>
    )}
    <span>{language}</span>
    <span>{"utf8"}</span>
  </footer>
);
