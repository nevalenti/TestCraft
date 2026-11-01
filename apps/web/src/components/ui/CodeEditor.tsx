import "@/lib/monacoEnvironment";

import Editor, { type OnChange, type OnMount } from "@monaco-editor/react";

import { cn } from "@/lib/cn";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string | number;
  readOnly?: boolean;
  padding?: { top: number; bottom: number };
  className?: string;
  onMount?: OnMount;
  variant?: "code" | "prose";
  transparent?: boolean;
}

export const CodeEditor = ({
  value,
  onChange,
  language = "json",
  height = "240px",
  readOnly = false,
  padding,
  className,
  onMount,
  variant = "code",
  transparent = false,
}: CodeEditorProps) => {
  const handleChange: OnChange = (newValue) => {
    onChange(newValue ?? "");
  };
  const isProse = variant === "prose";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-base-content/20",
        className,
      )}
    >
      <Editor
        value={value}
        language={language}
        height={height}
        theme={transparent ? "dracula-transparent" : "dracula"}
        loading={
          <span
            role="status"
            aria-label="Loading editor"
            className="loading loading-md loading-spinner text-primary"
          />
        }
        onChange={handleChange}
        onMount={onMount}
        options={{
          readOnly,
          padding,
          minimap: { enabled: false },
          fontFamily: "'Fira Code', ui-monospace, monospace",
          fontSize: isProse ? 14 : 13,
          lineHeight: isProse ? 24 : 0,
          wordWrap: isProse ? "on" : "off",
          lineNumbers: isProse ? "off" : "on",
          folding: !isProse,
          glyphMargin: false,
          lineDecorationsWidth: isProse ? 24 : 10,
          renderLineHighlight: isProse ? "none" : "line",
          overviewRulerLanes: isProse ? 0 : 3,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
};
