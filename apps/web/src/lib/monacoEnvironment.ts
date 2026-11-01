import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/editor/editor.worker.js?worker";
import cssWorker from "monaco-editor/language/css/css.worker.js?worker";
import htmlWorker from "monaco-editor/language/html/html.worker.js?worker";
import jsonWorker from "monaco-editor/language/json/json.worker.js?worker";
import tsWorker from "monaco-editor/language/typescript/ts.worker.js?worker";

// eslint-disable-next-line unicorn/no-global-object-property-assignment
globalThis.MonacoEnvironment = {
  getWorker(_workerId, label) {
    switch (label) {
      case "json": {
        return new jsonWorker();
      }
      case "css":
      case "scss":
      case "less": {
        return new cssWorker();
      }
      case "html":
      case "handlebars":
      case "razor": {
        return new htmlWorker();
      }
      case "typescript":
      case "javascript": {
        return new tsWorker();
      }
      default: {
        return new editorWorker();
      }
    }
  },
};

loader.config({ monaco });

const draculaTheme: monaco.editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "6272a4", fontStyle: "italic" },
    { token: "string", foreground: "f1fa8c" },
    { token: "string.key.json", foreground: "8be9fd" },
    { token: "string.value.json", foreground: "f1fa8c" },
    { token: "string.escape", foreground: "ff79c6" },
    { token: "number", foreground: "bd93f9" },
    { token: "regexp", foreground: "f1fa8c" },
    { token: "keyword", foreground: "ff79c6" },
    { token: "keyword.json", foreground: "bd93f9" },
    { token: "operator", foreground: "ff79c6" },
    { token: "namespace", foreground: "8be9fd", fontStyle: "italic" },
    { token: "type", foreground: "8be9fd", fontStyle: "italic" },
    { token: "type.identifier", foreground: "8be9fd", fontStyle: "italic" },
    { token: "class", foreground: "8be9fd" },
    { token: "interface", foreground: "8be9fd", fontStyle: "italic" },
    { token: "enum", foreground: "8be9fd" },
    { token: "typeParameter", foreground: "8be9fd", fontStyle: "italic" },
    { token: "function", foreground: "50fa7b" },
    { token: "member", foreground: "50fa7b" },
    { token: "macro", foreground: "ff79c6" },
    { token: "variable", foreground: "f8f8f2" },
    { token: "variable.predefined", foreground: "bd93f9" },
    { token: "parameter", foreground: "ffb86c", fontStyle: "italic" },
    { token: "tag", foreground: "ff79c6" },
    { token: "attribute.name", foreground: "50fa7b", fontStyle: "italic" },
    { token: "attribute.value", foreground: "f1fa8c" },
    { token: "metatag", foreground: "ff79c6" },
    { token: "delimiter", foreground: "f8f8f2" },
  ],
  colors: {
    "editor.background": "#282a36",
    "editor.foreground": "#f8f8f2",
    "editorLineNumber.foreground": "#6272a4",
    "editorLineNumber.activeForeground": "#f8f8f2",
    "editor.selectionBackground": "#44475a",
    "editor.inactiveSelectionBackground": "#44475a99",
    "editor.lineHighlightBackground": "#44475a4d",
    "editorCursor.foreground": "#f8f8f2",
    "editorIndentGuide.background": "#3b3e50",
    "editorIndentGuide.activeBackground": "#6272a4",
    "editorWhitespace.foreground": "#3b3e50",
    "editorBracketMatch.background": "#44475a",
    "editorBracketMatch.border": "#6272a4",
  },
};

monaco.editor.defineTheme("dracula", draculaTheme);
monaco.editor.defineTheme("dracula-transparent", {
  ...draculaTheme,
  colors: {
    ...draculaTheme.colors,
    "editor.background": "#00000000",
    "editorGutter.background": "#00000000",
  },
});
