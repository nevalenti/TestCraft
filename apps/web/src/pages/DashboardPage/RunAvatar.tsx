import { cn } from '@/lib/cn';
import { getInitials } from '@/lib/format';

const getRunAvatarLabel = (
  executedByName?: string | null,
  source?: string | null,
) => {
  if (executedByName) return getInitials(executedByName);
  if (source) return source.slice(0, 2).toUpperCase();
  return '?';
};

export const RunAvatar = ({
  executedByName,
  executedByAvatarUrl,
  source,
  size = 'size-6',
}: {
  executedByName?: string | null;
  executedByAvatarUrl?: string | null;
  source?: string | null;
  size?: string;
}) => {
  const title = executedByName ?? source ?? 'Unknown';

  if (executedByAvatarUrl) {
    return (
      <img
        src={executedByAvatarUrl}
        alt={title}
        title={title}
        className={cn(size, 'shrink-0 rounded-full object-cover')}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-base-content/8 text-[10px] font-bold text-base-content/70 tabular-nums',
        size,
      )}
      title={title}
    >
      {getRunAvatarLabel(executedByName, source)}
    </span>
  );
};
