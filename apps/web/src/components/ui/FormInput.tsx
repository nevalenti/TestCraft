import type React from "react";

interface FormInputProps extends React.ComponentPropsWithRef<"input"> {
  hasError?: boolean;
}

export const FormInput = ({
  hasError,
  className,
  ...props
}: FormInputProps) => {
  const base = "input-bordered input w-full bg-base-200";
  const cls = [base, hasError && "input-error", className]
    .filter(Boolean)
    .join(" ");
  return <input className={cls} {...props} />;
};
