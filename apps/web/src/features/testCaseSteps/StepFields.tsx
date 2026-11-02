interface StepFieldProps {
  label: string;
  value: string;
}

const StepField = ({ label, value }: StepFieldProps) => (
  <div>
    <p className="mb-1 text-[11px] font-semibold tracking-wider text-fg-subtle uppercase">
      {label}
    </p>
    <p className="text-sm leading-relaxed text-base-content">{value}</p>
  </div>
);

interface StepFieldsProps {
  action: string;
  expectedResult: string;
}

export const StepFields = ({ action, expectedResult }: StepFieldsProps) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <StepField label="Action" value={action} />
    <StepField label="Expected Result" value={expectedResult} />
  </div>
);
