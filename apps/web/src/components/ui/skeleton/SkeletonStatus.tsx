interface SkeletonStatusProps {
  label: string;
  children: React.ReactNode;
}

export const SkeletonStatus = ({ label, children }: SkeletonStatusProps) => (
  <div role="status" aria-live="polite">
    <span className="sr-only">{label}</span>
    {children}
  </div>
);
