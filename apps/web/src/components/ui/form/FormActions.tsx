interface FormActionsProps {
  onCancel: () => void;
  isLoading: boolean;
  label?: string;
}

export const FormActions = ({
  onCancel,
  isLoading,
  label = "Save",
}: FormActionsProps) => (
  <div className="flex justify-end gap-2 pt-3">
    <button
      type="button"
      className="btn text-fg-secondary btn-ghost btn-sm"
      onClick={onCancel}
    >
      Cancel
    </button>
    <button
      type="submit"
      className="btn min-w-16 btn-sm btn-primary"
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
