import { useForm } from 'react-hook-form';

import { FormActions } from '@/components/ui/FormActions';
import { FormField } from '@/components/ui/FormField';
import { FormInput } from '@/components/ui/FormInput';
import { LabelBadge } from '@/components/ui/LabelBadge';

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];

interface LabelFormValues {
  name: string;
  color: string;
}

interface LabelFormProps {
  defaultValues?: LabelFormValues;
  onSubmit: (data: LabelFormValues) => void;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
}

export const LabelForm = ({
  defaultValues = { name: '', color: PRESET_COLORS[0] },
  onSubmit,
  onCancel,
  isLoading,
  submitLabel,
}: LabelFormProps) => {
  const { register, handleSubmit, watch, setValue } = useForm<LabelFormValues>({
    defaultValues,
  });
  const color = watch('color');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Name" htmlFor="label-name">
        <FormInput
          id="label-name"
          {...register('name', { required: true })}
          placeholder="e.g. smoke, regression, flaky"
          autoFocus
        />
      </FormField>

      <FormField label="Color" htmlFor="label-color-custom">
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              type="button"
              className="size-6 rounded-full ring-offset-2 transition-all"
              style={{
                backgroundColor: presetColor,
                boxShadow:
                  color === presetColor
                    ? `0 0 0 2px ${presetColor}`
                    : undefined,
              }}
              onClick={() => setValue('color', presetColor)}
              aria-label={presetColor}
            />
          ))}
          <input
            id="label-color-custom"
            type="color"
            {...register('color')}
            className="size-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
            title="Custom color"
          />
        </div>
        <div className="mt-1">
          <LabelBadge
            label={{
              id: '',
              name: watch('name') || 'Preview',
              color,
              projectId: '',
            }}
          />
        </div>
      </FormField>

      <FormActions
        onCancel={onCancel}
        isLoading={isLoading}
        label={submitLabel}
      />
    </form>
  );
};
