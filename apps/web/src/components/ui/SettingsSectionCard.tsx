interface SettingsSectionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const SettingsSectionCard = ({
  icon: Icon,
  title,
  description,
  children,
}: SettingsSectionCardProps) => (
  <div className="panel p-5 [&_[data-list-toolbar]]:static [&_[data-list-toolbar]]:mt-0 [&_[data-list-toolbar]]:bg-transparent [&_[data-list-toolbar]]:pt-0">
    <div className="mb-4 flex items-start gap-3">
      <span className="card-bg-primary flex size-9 shrink-0 items-center justify-center rounded-lg border text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-base-content">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs leading-5 text-fg-muted">
            {description}
          </p>
        )}
      </div>
    </div>
    {children}
  </div>
);
