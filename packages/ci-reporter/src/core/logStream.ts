const ANSI_PATTERN = new RegExp('[\\u001B\\u009B]\\[[0-9;]*[a-zA-Z]', 'g');
const stripAnsi = (text: string): string => text.replace(ANSI_PATTERN, '');

type WriteFn = typeof process.stdout.write;

export interface StdioCapture {
  restore(): void;
  flush(): void;
}

export const createStdioCapture = (
  onLines: (lines: string[]) => void,
): StdioCapture => {
  let stdoutBuffer = '';
  let stderrBuffer = '';

  const capture = (chunk: string | Uint8Array, isErr: boolean): void => {
    const text = stripAnsi(chunk.toString());
    const combined = (isErr ? stderrBuffer : stdoutBuffer) + text;
    const parts = combined.split('\n');
    const remainder = parts.pop() ?? '';
    if (isErr) stderrBuffer = remainder;
    else stdoutBuffer = remainder;

    const lines = parts.filter((line) => line.length > 0);
    if (lines.length) onLines(lines);
  };

  const origStdoutWrite = process.stdout.write.bind(process.stdout);
  const origStderrWrite = process.stderr.write.bind(process.stderr);

  process.stdout.write = ((chunk: string | Uint8Array, ...args: unknown[]) => {
    capture(chunk, false);
    return (origStdoutWrite as (...a: unknown[]) => boolean)(chunk, ...args);
  }) as WriteFn;
  process.stderr.write = ((chunk: string | Uint8Array, ...args: unknown[]) => {
    capture(chunk, true);
    return (origStderrWrite as (...a: unknown[]) => boolean)(chunk, ...args);
  }) as WriteFn;

  return {
    restore: () => {
      process.stdout.write = origStdoutWrite;
      process.stderr.write = origStderrWrite;
    },
    flush: () => {
      const trailing = [stdoutBuffer, stderrBuffer].filter(
        (line) => line.length > 0,
      );
      stdoutBuffer = '';
      stderrBuffer = '';
      if (trailing.length) onLines(trailing);
    },
  };
};
