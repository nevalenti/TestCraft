import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/cn";

const components: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

interface NoteMarkdownProps {
  content: string;
  className?: string;
}

export const NoteMarkdown = ({ content, className }: NoteMarkdownProps) => (
  <div className={cn("note-prose", className)}>
    {content.trim() ? (
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    ) : (
      <p className="text-fg-subtle italic">Nothing to preview yet.</p>
    )}
  </div>
);
