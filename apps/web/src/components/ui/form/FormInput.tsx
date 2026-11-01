import type React from "react";

import { useFormFieldAttributes } from "@/components/ui/form/formFieldContext";
import { cn } from "@/lib/cn";

interface FormInputProps extends React.ComponentPropsWithRef<"input"> {
  hasError?: boolean;
}

export const FormInput = ({
  hasError,
  className,
  ...props
}: FormInputProps) => {
  const fieldAttributes = useFormFieldAttributes({
    ...props,
    "aria-invalid": hasError || props["aria-invalid"],
  });
  return (
    <input
      className={cn(
        "input input-bordered w-full bg-base-200/60",
        hasError && "input-error",
        className,
      )}
      data-autofocus={props.autoFocus || undefined}
      {...props}
      {...fieldAttributes}
    />
  );
};
