import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormActions } from '@/components/ui/FormActions';
import { FormField } from '@/components/ui/FormField';
import { FormInput } from '@/components/ui/FormInput';
import { FormTextarea } from '@/components/ui/FormTextarea';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000),
});

type FormValues = z.infer<typeof schema>;

interface TestPlanFormProps {
  defaultValues?: FormValues;
  submitLabel: string;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const TestPlanForm = ({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
  isLoading,
}: TestPlanFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data))}
      className="space-y-4"
    >
      <FormField label="Name" htmlFor="plan-name" error={errors.name?.message}>
        <FormInput
          id="plan-name"
          hasError={!!errors.name}
          autoFocus
          {...register('name')}
        />
      </FormField>
      <FormField
        label="Description (optional)"
        htmlFor="plan-description"
        error={errors.description?.message}
      >
        <FormTextarea
          id="plan-description"
          hasError={!!errors.description}
          rows={2}
          {...register('description')}
        />
      </FormField>
      <FormActions
        onCancel={onCancel}
        isLoading={isLoading}
        label={submitLabel}
      />
    </form>
  );
};
