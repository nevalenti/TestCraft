import { zodResolver } from "@hookform/resolvers/zod";
import type {
  CreateTestCaseStepInput,
  UpdateTestCaseStepInput,
} from "@testcraft/types";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";

const schema = z.object({
  action: z.string().min(1, "Action is required").max(255),
  expectedResult: z.string().min(1, "Expected result is required").max(255),
});

type FormValues = z.infer<typeof schema>;

interface StepFormProps {
  defaultValues?: { order: number; action: string; expectedResult: string };
  nextOrder: number;
  onSubmit: (data: CreateTestCaseStepInput | UpdateTestCaseStepInput) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const StepForm = ({
  defaultValues,
  nextOrder,
  onSubmit,
  onCancel,
  isLoading,
}: StepFormProps) => {
  const order = defaultValues?.order ?? nextOrder;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      action: defaultValues?.action ?? "",
      expectedResult: defaultValues?.expectedResult ?? "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit({ order, ...data }))}
      className="space-y-4"
    >
      <FormField
        label="Action"
        htmlFor="step-action"
        error={errors.action?.message}
      >
        <textarea
          id="step-action"
          className={`textarea textarea-bordered bg-base-200 w-full${errors.action ? " textarea-error" : ""}`}
          placeholder="Navigate to the login page"
          rows={3}
          autoFocus
          {...register("action")}
        />
      </FormField>
      <FormField
        label="Expected Result"
        htmlFor="step-expected-result"
        error={errors.expectedResult?.message}
      >
        <textarea
          id="step-expected-result"
          className={`textarea textarea-bordered bg-base-200 w-full${errors.expectedResult ? " textarea-error" : ""}`}
          placeholder="Login page is displayed"
          rows={3}
          {...register("expectedResult")}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
