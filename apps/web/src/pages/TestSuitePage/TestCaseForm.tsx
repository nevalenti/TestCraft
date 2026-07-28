import { zodResolver } from '@hookform/resolvers/zod';
import { TestCasePriority } from '@testcraft/types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormActions } from '@/components/ui/FormActions';
import { FormField } from '@/components/ui/FormField';
import { FormInput } from '@/components/ui/FormInput';
import { FormTextarea } from '@/components/ui/FormTextarea';
import { priorityOptions } from '@/lib/constants';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  priority: z.nativeEnum(TestCasePriority),
  description: z.string().max(1000),
});

type FormValues = z.infer<typeof schema>;

interface TestCaseFormProps {
  defaultValues?: {
    name: string;
    description: string;
    priority: TestCasePriority;
  };
  onSubmit: (data: {
    name: string;
    description?: string;
    priority: TestCasePriority;
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const TestCaseForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: TestCaseFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      priority: defaultValues?.priority ?? TestCasePriority.Medium,
      description: defaultValues?.description ?? '',
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({ ...data, description: data.description || undefined }),
      )}
      className="space-y-4"
    >
      <FormField label="Name" htmlFor="case-name" error={errors.name?.message}>
        <FormInput
          id="case-name"
          hasError={!!errors.name}
          placeholder="User can log in with valid credentials"
          autoFocus
          {...register('name')}
        />
      </FormField>
      <FormField
        label="Priority"
        htmlFor="case-priority"
        error={errors.priority?.message}
      >
        <select
          id="case-priority"
          className="select-bordered select w-full"
          {...register('priority')}
        >
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField
        label="Description"
        htmlFor="case-description"
        error={errors.description?.message}
      >
        <FormTextarea
          id="case-description"
          placeholder="Optional"
          rows={2}
          {...register('description')}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
