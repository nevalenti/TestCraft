import type React from 'react';

import { cn } from '@/lib/cn';

interface FormTextareaProps extends React.ComponentPropsWithRef<'textarea'> {
  hasError?: boolean;
}

export const FormTextarea = ({
  hasError,
  className,
  ...props
}: FormTextareaProps) => (
  <textarea
    className={cn(
      'textarea textarea-bordered w-full bg-base-200/60',
      hasError && 'textarea-error',
      className,
    )}
    {...props}
  />
);
