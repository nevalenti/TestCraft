import { useForm } from 'react-hook-form';

interface RunFromPlanFormProps {
  planName: string;
  onSubmit: (data: { name: string; environment: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const RunFromPlanForm = ({
  planName,
  onSubmit,
  onCancel,
  isLoading,
}: RunFromPlanFormProps) => {
  const { register, handleSubmit } = useForm<{
    name: string;
    environment: string;
  }>({ defaultValues: { name: '', environment: '' } });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="run-name" className="label-text label text-xs">
          Run Name
        </label>
        <input
          id="run-name"
          className="input-bordered input input-sm w-full"
          autoFocus
          placeholder={`${planName} – Run 1`}
          {...register('name', { required: true })}
        />
      </div>
      <div>
        <label htmlFor="run-env" className="label-text label text-xs">
          Environment (optional)
        </label>
        <input
          id="run-env"
          className="input-bordered input input-sm w-full"
          placeholder="e.g. staging"
          {...register('environment')}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-sm btn-primary"
          disabled={isLoading}
        >
          Start Run
        </button>
      </div>
    </form>
  );
};
