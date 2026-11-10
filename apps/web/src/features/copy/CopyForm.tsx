import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormActions } from "@/components/ui/form/FormActions";
import { FormField } from "@/components/ui/form/FormField";
import { FormInput } from "@/components/ui/form/FormInput";
import { FormSelect } from "@/components/ui/form/FormSelect";

const schema = z.object({
  name: z.string().max(255),
  target: z.string(),
});

type FormValues = z.infer<typeof schema>;

export interface CopyTarget {
  label: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}

interface CopyFormProps {
  target?: CopyTarget;
  onSubmit: (values: { name?: string; target?: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const CopyForm = ({
  target,
  onSubmit,
  onCancel,
  isLoading,
}: CopyFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", target: target?.defaultValue ?? "" },
  });

  return (
    <form
      onSubmit={handleSubmit((data) =>
        onSubmit({
          name: data.name.trim() || undefined,
          target: target ? data.target : undefined,
        }),
      )}
      className="space-y-4"
    >
      {target && (
        <FormField label={target.label} htmlFor="copy-target">
          <FormSelect id="copy-target" {...register("target")}>
            {target.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>
        </FormField>
      )}
      <FormField
        label="Name"
        htmlFor="copy-name"
        optional
        hint="Leave blank to keep the name, adding (copy) if it is taken."
        error={errors.name?.message}
      >
        <FormInput
          id="copy-name"
          hasError={!!errors.name}
          autoFocus
          {...register("name")}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} label="Copy" />
    </form>
  );
};
