import type { TestCaseStep } from "@testcraft/types";

interface StepDragPreviewProps {
  step: TestCaseStep;
}

export const StepDragPreview = ({ step }: StepDragPreviewProps) => (
  <div className="card-bg-info rotate-[0.5deg] cursor-grabbing rounded-lg border border-border p-4 shadow-2xl ring-1 ring-primary/20">
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded bg-base-content/10 text-[11px] font-bold text-base-content/70 tabular-nums">
        {step.order}
      </span>
      <span className="text-xs font-semibold text-base-content/60">Step</span>
    </div>
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-base-content/50 uppercase">
          Action
        </p>
        <p className="text-sm leading-relaxed text-base-content/90">
          {step.action}
        </p>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-base-content/50 uppercase">
          Expected Result
        </p>
        <p className="text-sm leading-relaxed text-base-content/90">
          {step.expectedResult}
        </p>
      </div>
    </div>
  </div>
);
