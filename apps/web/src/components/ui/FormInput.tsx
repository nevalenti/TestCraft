import type React from "react";

import { cn } from "@/lib/cn";

interface FormInputProps extends React.ComponentPropsWithRef<"input"> {
  hasError?: boolean;
}

export const FormInput = ({
  hasError,
  className,
  ...props
}: FormInputProps) => (
  <input
    className={cn(
      "input input-bordered w-full bg-base-200/60",
      hasError && "input-error",
      className,
    )}
    {...props}
  />
);
