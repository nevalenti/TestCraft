interface FormFieldProps {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}

export const FormField = ({ label, htmlFor, children }: FormFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold text-base-content/70"
    >
      {label}
    </label>
    {children}
  </div>
);
