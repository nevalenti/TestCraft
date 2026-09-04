import type { TestCaseStep } from '@testcraft/types';

import { StepFields } from '@/pages/TestCasePage/StepFields';

interface StepDragPreviewProps {
  step: TestCaseStep;
}

export const StepDragPreview = ({ step }: StepDragPreviewProps) => (
  <div className="card-bg-info rotate-[0.5deg] cursor-grabbing rounded-lg border border-border p-4 shadow-2xl ring-1 ring-primary/20">
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded bg-base-content/10 text-xs font-bold text-base-content tabular-nums">
        {step.order}
      </span>
      <span className="text-xs font-semibold text-base-content">Step</span>
    </div>
    <StepFields action={step.action} expectedResult={step.expectedResult} />
  </div>
);
