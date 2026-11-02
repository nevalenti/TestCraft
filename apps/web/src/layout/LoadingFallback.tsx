export const LoadingFallback = () => (
  <div className="flex min-h-80 flex-1 items-center justify-center motion-safe:animate-[fade-in-delayed_200ms_ease-out_300ms_both]">
    <span className="loading loading-md loading-spinner text-fg-subtle" />
  </div>
);
