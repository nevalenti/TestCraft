export const DEFAULT_NOTE_LANGUAGE = "markdown";

export const NOTE_LANGUAGES = [
  { value: "markdown", label: "Markdown", short: "MD", extension: "md" },
  { value: "plaintext", label: "Plain text", short: "TXT", extension: "txt" },
  { value: "json", label: "JSON", short: "JSON", extension: "json" },
  { value: "javascript", label: "JavaScript", short: "JS", extension: "js" },
  { value: "typescript", label: "TypeScript", short: "TS", extension: "ts" },
  { value: "python", label: "Python", short: "PY", extension: "py" },
  { value: "csharp", label: "C#", short: "C#", extension: "cs" },
  { value: "sql", label: "SQL", short: "SQL", extension: "sql" },
  { value: "yaml", label: "YAML", short: "YAML", extension: "yaml" },
  { value: "html", label: "HTML", short: "HTML", extension: "html" },
  { value: "css", label: "CSS", short: "CSS", extension: "css" },
] as const;

const findLanguage = (value: string) =>
  NOTE_LANGUAGES.find((language) => language.value === value);

export const languageShortLabel = (value: string) =>
  findLanguage(value)?.short ?? value.toUpperCase();

export const isProseLanguage = (value: string) =>
  value === "markdown" || value === "plaintext";

export const noteFileName = (title: string, language: string) => {
  const base =
    title
      .trim()
      .replaceAll(/[^\w\- ]+/g, "")
      .replaceAll(/\s+/g, "-")
      .toLowerCase() || "note";

  return `${base}.${findLanguage(language)?.extension ?? "txt"}`;
};
