export const SkeletonStatus = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div role="status" aria-live="polite">
    <span className="sr-only">{label}</span>
    {children}
  </div>
);
