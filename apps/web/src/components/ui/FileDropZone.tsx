import {
  ArrowUpTrayIcon,
  DocumentIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useRef, useState } from "react";

import { cn } from "@/lib/cn";

interface FileDropZoneProps {
  id: string;
  accept: string;
  multiple?: boolean;
  files: File[];
  onFilesChange: (files: File[]) => void;
  hint?: string;
  hasError?: boolean;
  color?: "primary" | "secondary";
}

const isAccepted = (file: File, accept: string): boolean =>
  accept.split(",").some((token) => {
    const trimmed = token.trim();

    if (trimmed.startsWith("."))
      return file.name.toLowerCase().endsWith(trimmed.toLowerCase());
    if (trimmed.endsWith("/*"))
      return file.type.startsWith(trimmed.slice(0, -1));

    return file.type === trimmed;
  });

const colorClasses = {
  primary: {
    ring: "focus-visible:ring-primary",
    drag: "border-primary bg-primary/5",
    hover: "hover:border-primary/40 hover:bg-base-200/70",
    text: "text-primary",
    textMuted: "text-primary/70 hover:text-primary",
  },
  secondary: {
    ring: "focus-visible:ring-secondary",
    drag: "border-secondary bg-secondary/5",
    hover: "hover:border-secondary/40 hover:bg-base-200/70",
    text: "text-secondary",
    textMuted: "text-secondary/70 hover:text-secondary",
  },
};

export const FileDropZone = ({
  id,
  accept,
  multiple = false,
  files,
  onFilesChange,
  hint,
  hasError,
  color = "primary",
}: FileDropZoneProps) => {
  const c = colorClasses[color];
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const openPicker = () => {
    if (!inputRef.current) return;

    inputRef.current.value = "";
    inputRef.current.click();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilesChange([...(event.target.files ?? [])]);
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const dropped = [...event.dataTransfer.files].filter((droppedFile) =>
      isAccepted(droppedFile, accept),
    );

    if (dropped.length > 0) onFilesChange(dropped);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="File upload area"
      className={cn(
        "rounded-xl border-2 border-dashed outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        c.ring,
        isDragging && c.drag,
        !isDragging && hasError && "border-error/50 bg-error/5",
        !isDragging &&
          !hasError &&
          cn("border-base-300 bg-base-200/40 transition-colors", c.hover),
      )}
      onClick={openPicker}
      onKeyDown={(event) =>
        (event.key === "Enter" || event.key === " ") && openPicker()
      }
      onDragEnter={handleDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={handleInputChange}
        onClick={(event) => event.stopPropagation()}
        tabIndex={-1}
      />

      {files.length === 0 ? (
        <div className="pointer-events-none flex flex-col items-center gap-2.5 px-4 py-8 text-center select-none">
          <div className="rounded-full bg-base-300 p-2.5">
            <ArrowUpTrayIcon className="size-5 text-base-content/50" />
          </div>
          <div>
            <p className="text-sm text-base-content/70">
              <span className={cn("font-medium", c.text)}>Click to upload</span>{" "}
              or drag & drop
            </p>
            {hint && (
              <p className="mt-0.5 text-xs text-base-content/40">{hint}</p>
            )}
          </div>
        </div>
      ) : (
        <div
          role="presentation"
          className="flex flex-col gap-1 p-3"
          onClick={(event) => event.stopPropagation()}
        >
          {files.map((file, fileIndex) => (
            <div
              key={fileIndex}
              className="flex items-center gap-2 rounded-lg bg-base-100 px-3 py-2 shadow-sm"
            >
              <DocumentIcon className="size-4 shrink-0 text-base-content/40" />
              <span className="flex-1 truncate text-sm font-medium text-base-content/80">
                {file.name}
              </span>
              <span className="text-xs whitespace-nowrap text-base-content/40 tabular-nums">
                {(file.size / 1024).toFixed(1)} KB
              </span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                className="ml-1 rounded p-0.5 text-base-content/30 transition-colors hover:bg-error/10 hover:text-error"
                onClick={() => removeFile(fileIndex)}
              >
                <XMarkIcon className="size-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            className={cn(
              "mt-1 flex items-center gap-1.5 px-1 py-0.5 text-xs transition-colors",
              c.textMuted,
            )}
            onClick={openPicker}
          >
            <ArrowUpTrayIcon className="size-3" />
            {multiple ? "Add or replace files" : "Replace file"}
          </button>
        </div>
      )}
    </div>
  );
};
