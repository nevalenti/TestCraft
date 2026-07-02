interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export const FormField = ({
  label,
  htmlFor,
  error,
  hint,
  children,
}: FormFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold text-base-content/80"
    >
      {label}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-base-content/70">{hint}</p>}
    {error && <p className="text-xs font-medium text-error">{error}</p>}
  </div>
);
