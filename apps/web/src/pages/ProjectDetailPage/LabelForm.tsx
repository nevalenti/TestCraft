import { useForm } from 'react-hook-form';

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
      <div className="space-y-1.5">
        <label htmlFor="label-name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="label-name"
          {...register('name', { required: true })}
          className="input-bordered input w-full"
          placeholder="e.g. smoke, regression, flaky"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="label-color-custom" className="text-sm font-medium">
          Color
        </label>
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
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-sm" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-sm btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading loading-xs loading-spinner" />
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
};
