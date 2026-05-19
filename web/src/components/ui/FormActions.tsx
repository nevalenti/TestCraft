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
  <div className="flex justify-end gap-2 pt-2">
    <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
      Cancel
    </button>
    <button
      type="submit"
      className="btn btn-primary btn-sm"
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="loading loading-spinner loading-sm" />
      ) : (
        label
      )}
    </button>
  </div>
);
