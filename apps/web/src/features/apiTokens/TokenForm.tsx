import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormActions } from "@/components/ui/form/FormActions";
import { FormField } from "@/components/ui/form/FormField";
import { FormInput } from "@/components/ui/form/FormInput";
import { FormSelect } from "@/components/ui/form/FormSelect";
import {
  CI_PIPELINE_ACCESS,
  TOKEN_RESOURCES,
} from "@/features/apiTokens/scopes";
import { todayLocalDate } from "@/lib/format";

const accessLevel = z.enum(["none", "read", "write"]);

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  expiresAt: z.string(),
  access: z
    .object({
      runs: accessLevel,
      results: accessLevel,
      imports: accessLevel,
      suites: accessLevel,
      cases: accessLevel,
      labels: accessLevel,
      plans: accessLevel,
      notes: accessLevel,
      analytics: accessLevel,
    })
    .refine(
      (access) => Object.values(access).some((level) => level !== "none"),
      {
        message: "Give the token access to at least one area",
      },
    ),
});

type FormValues = z.infer<typeof schema>;

interface TokenFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const TokenForm = ({
  onSubmit,
  onCancel,
  isLoading,
}: TokenFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", expiresAt: "", access: CI_PIPELINE_ACCESS },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label="Token name"
        htmlFor="token-name"
        error={errors.name?.message}
      >
        <FormInput
          id="token-name"
          placeholder="e.g. CI pipeline"
          hasError={!!errors.name}
          autoFocus
          {...register("name")}
        />
      </FormField>
      <FormField label="Expires" htmlFor="token-expires" optional>
        <FormInput
          id="token-expires"
          type="date"
          min={todayLocalDate()}
          {...register("expiresAt")}
        />
      </FormField>
      <FormField
        label="Access"
        error={errors.access?.root?.message ?? errors.access?.message}
      >
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {TOKEN_RESOURCES.map(({ resource, label, canWrite }) => (
            <label
              key={resource}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span>{label}</span>
              <FormSelect
                aria-label={`${label} access`}
                className="select w-36 select-sm"
                {...register(`access.${resource}`)}
              >
                <option value="none">No access</option>
                <option value="read">Read</option>
                {canWrite && <option value="write">Read &amp; write</option>}
              </FormSelect>
            </label>
          ))}
        </div>
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} label="Create" />
    </form>
  );
};
