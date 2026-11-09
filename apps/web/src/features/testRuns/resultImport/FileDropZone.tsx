import {
  ArrowUpTrayIcon,
  DocumentIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useRef, useState } from "react";

import { useFormFieldAttributes } from "@/components/ui/form/formFieldContext";
import { cn } from "@/lib/cn";
import { formatBytes } from "@/lib/format";

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
  const fieldAttributes = useFormFieldAttributes({
    id,
    "aria-invalid": hasError || undefined,
  });
  const colorTheme = colorClasses[color];
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const resetInput = (event: React.MouseEvent<HTMLInputElement>) => {
    event.currentTarget.value = "";
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
      className={cn(
        "rounded-xl border-2 border-dashed has-focus-visible:ring-2 has-focus-visible:ring-offset-2",
        colorTheme.ring,
        isDragging && colorTheme.drag,
        !isDragging && hasError && "border-error/50 bg-error/5",
        !isDragging &&
          !hasError &&
          cn(
            "border-base-300 bg-base-200/40 transition-colors",
            colorTheme.hover,
          ),
      )}
      onDragEnter={handleDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        {...fieldAttributes}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={handleInputChange}
        onClick={resetInput}
      />

      {files.length === 0 ? (
        <label
          htmlFor={fieldAttributes.id}
          className="flex cursor-pointer flex-col items-center gap-2.5 px-4 py-8 text-center select-none"
        >
          <span className="rounded-full bg-base-300 p-2.5">
            <ArrowUpTrayIcon
              className="size-5 text-fg-secondary"
              aria-hidden="true"
            />
          </span>
          <span>
            <span className="block text-sm text-fg-secondary">
              <span className={cn("font-medium", colorTheme.text)}>
                Click to upload
              </span>{" "}
              or drag & drop
            </span>
            {hint && (
              <span className="mt-0.5 block text-xs text-fg-muted">{hint}</span>
            )}
          </span>
        </label>
      ) : (
        <div className="flex flex-col gap-1 p-3">
          <ul className="flex flex-col gap-1">
            {files.map((file, fileIndex) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center gap-2 rounded-lg bg-base-100 px-3 py-2 shadow-sm"
              >
                <DocumentIcon
                  className="size-4 shrink-0 text-fg-muted"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg-secondary">
                  {file.name}
                </span>
                <span className="text-xs whitespace-nowrap text-fg-muted tabular-nums">
                  {formatBytes(file.size)}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  className="ml-1 flex size-6 shrink-0 items-center justify-center rounded text-fg-subtle transition-colors hover:bg-error/10 hover:text-error"
                  onClick={() => removeFile(fileIndex)}
                >
                  <XMarkIcon className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <label
            htmlFor={fieldAttributes.id}
            className={cn(
              "mt-1 flex w-fit cursor-pointer items-center gap-1.5 px-1 py-0.5 text-xs transition-colors",
              colorTheme.textMuted,
            )}
          >
            <ArrowUpTrayIcon className="size-3" aria-hidden="true" />
            {multiple ? "Add or replace files" : "Replace file"}
          </label>
        </div>
      )}
    </div>
  );
};
