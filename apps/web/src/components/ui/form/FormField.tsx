import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { useId } from "react";

import { FormFieldContext } from "@/components/ui/form/formFieldContext";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}

export const FormField = ({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
}: FormFieldProps) => {
  const generatedId = useId();
  const controlId = htmlFor ?? generatedId;
  const feedbackId = `${controlId}-feedback`;

  return (
    <FormFieldContext
      value={{
        id: controlId,
        "aria-describedby": error || hint ? feedbackId : undefined,
        "aria-invalid": error ? true : undefined,
      }}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <label
            htmlFor={controlId}
            className="text-[13px] font-medium text-fg-secondary"
          >
            {label}
          </label>
          {optional && <span className="text-xs text-fg-subtle">Optional</span>}
        </div>
        {children}
        {hint && !error && (
          <p id={feedbackId} className="text-xs text-fg-subtle">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={feedbackId}
            className="flex items-center gap-1 text-xs font-medium text-error"
          >
            <ExclamationCircleIcon
              className="size-3.5 shrink-0"
              aria-hidden="true"
            />
            {error}
          </p>
        )}
      </div>
    </FormFieldContext>
  );
};
