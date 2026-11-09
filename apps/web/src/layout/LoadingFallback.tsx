export const LoadingFallback = () => (
  <div
    role="status"
    className="flex min-h-80 flex-1 items-center justify-center motion-safe:animate-[fade-in-delayed_200ms_ease-out_300ms_both]"
  >
    <span
      className="loading loading-md loading-spinner text-fg-subtle"
      aria-hidden="true"
    />
    <span className="sr-only">Loading…</span>
  </div>
);
