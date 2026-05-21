import { useState } from "react";

import { FormActions } from "@/components/ui/FormActions";
import { FormField } from "@/components/ui/FormField";
import type { CreateTestCaseStepDto, UpdateTestCaseStepDto } from "@/types";

interface StepFormProps {
  defaultValues?: { order: number; action: string; expectedResult: string };
  nextOrder: number;
  onSubmit: (data: CreateTestCaseStepDto | UpdateTestCaseStepDto) => void;
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
  const [action, setAction] = useState(defaultValues?.action ?? "");
  const [expectedResult, setExpectedResult] = useState(
    defaultValues?.expectedResult ?? "",
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ order, action, expectedResult });
      }}
      className="space-y-4"
    >
      <FormField label="Action" htmlFor="step-action">
        <textarea
          id="step-action"
          className="textarea textarea-bordered bg-base-200 w-full"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          required
          maxLength={255}
          placeholder="Navigate to the login page"
          rows={3}
          autoFocus
        />
      </FormField>
      <FormField label="Expected Result" htmlFor="step-expected-result">
        <textarea
          id="step-expected-result"
          className="textarea textarea-bordered bg-base-200 w-full"
          value={expectedResult}
          onChange={(e) => setExpectedResult(e.target.value)}
          required
          maxLength={255}
          placeholder="Login page is displayed"
          rows={3}
        />
      </FormField>
      <FormActions onCancel={onCancel} isLoading={isLoading} />
    </form>
  );
};
