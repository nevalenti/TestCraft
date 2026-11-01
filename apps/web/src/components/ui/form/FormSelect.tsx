import type { ComponentPropsWithRef } from "react";

import { useFormFieldAttributes } from "@/components/ui/form/formFieldContext";
import { cn } from "@/lib/cn";

export const FormSelect = ({
  className,
  ...props
}: ComponentPropsWithRef<"select">) => {
  const fieldAttributes = useFormFieldAttributes(props);
  return (
    <select
      className={cn("select w-full bg-base-200/60", className)}
      {...props}
      {...fieldAttributes}
    />
  );
};
