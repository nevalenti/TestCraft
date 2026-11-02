import type React from "react";

import { useFormFieldAttributes } from "@/components/ui/form/formFieldContext";
import { cn } from "@/lib/cn";

interface FormTextareaProps extends React.ComponentPropsWithRef<"textarea"> {
  hasError?: boolean;
}

export const FormTextarea = ({
  hasError,
  className,
  ...props
}: FormTextareaProps) => {
  const fieldAttributes = useFormFieldAttributes({
    ...props,
    "aria-invalid": hasError || props["aria-invalid"],
  });
  return (
    <textarea
      className={cn(
        "textarea textarea-bordered w-full bg-base-200/60",
        hasError && "textarea-error",
        className,
      )}
      data-autofocus={props.autoFocus || undefined}
      {...props}
      {...fieldAttributes}
    />
  );
};
