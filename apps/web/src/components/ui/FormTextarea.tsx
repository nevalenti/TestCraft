import type React from "react";

interface FormTextareaProps extends React.ComponentPropsWithRef<"textarea"> {
  hasError?: boolean;
}

export const FormTextarea = ({
  hasError,
  className,
  ...props
}: FormTextareaProps) => {
  const base = "textarea-bordered textarea w-full bg-base-200";
  const cls = [base, hasError && "textarea-error", className]
    .filter(Boolean)
    .join(" ");

  return <textarea className={cls} {...props} />;
};
