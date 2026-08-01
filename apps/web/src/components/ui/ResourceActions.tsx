import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';

import { cn } from '@/lib/cn';

interface ResourceActionsProps {
  onEdit: () => void;
  onDelete?: () => void;
  itemName: string;
  size?: 'sm' | 'xs';
}

export const ResourceActions = ({
  onEdit,
  onDelete,
  itemName,
  size = 'sm',
}: ResourceActionsProps) => (
  <>
    <button
      className={cn(
        'btn btn-ghost text-base-content/70 hover:text-base-content',
        `btn-${size}`,
      )}
      onClick={onEdit}
      aria-label={`Edit ${itemName}`}
    >
      <PencilIcon className={cn(size === 'xs' ? 'size-3.5' : 'size-4')} />
    </button>
    {onDelete && (
      <button
        className={cn(
          'btn btn-ghost text-base-content/70 hover:text-error',
          `btn-${size}`,
        )}
        onClick={onDelete}
        aria-label={`Delete ${itemName}`}
      >
        <TrashIcon className={cn(size === 'xs' ? 'size-3.5' : 'size-4')} />
      </button>
    )}
  </>
);
