interface SettingsSectionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const SettingsSectionCard = ({
  icon: Icon,
  title,
  description,
  action,
  children,
}: SettingsSectionCardProps) => (
  <section aria-label={title} className="panel p-5">
    <div className="mb-4 flex flex-wrap items-start gap-x-4 gap-y-3">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary"
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1 basis-48">
        <h3 className="text-sm font-semibold text-base-content">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs leading-5 text-fg-muted">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    {children}
  </section>
);
