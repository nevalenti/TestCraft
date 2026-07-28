import { cn } from '@/lib/cn';

interface FormActionsProps {
  onCancel: () => void;
  isLoading: boolean;
  label?: string;
  variant?: 'primary' | 'secondary';
}

export const FormActions = ({
  onCancel,
  isLoading,
  label = 'Save',
  variant = 'primary',
}: FormActionsProps) => (
  <div className="flex justify-end gap-2 pt-3">
    <button
      type="button"
      className="btn text-base-content/85 btn-ghost btn-sm"
      onClick={onCancel}
    >
      Cancel
    </button>
    <button
      type="submit"
      className={cn(
        'btn btn-sm min-w-16',
        variant === 'secondary' ? 'btn-secondary' : 'btn-primary',
      )}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="loading loading-sm loading-spinner" />
      ) : (
        label
      )}
    </button>
  </div>
);
