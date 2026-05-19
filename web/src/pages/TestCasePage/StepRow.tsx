import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";
import type { TestCaseStepDto } from "@/types";

interface StepRowProps {
  step: TestCaseStepDto;
  onEdit: () => void;
  onDelete: () => void;
}

export const StepRow = ({ step, onEdit, onDelete }: StepRowProps) => (
  <div className="relative bg-base-100 border border-border border-l-4 border-l-primary p-5 group transition-all duration-150 hover:shadow-md">
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <span className="flex size-6 items-center justify-center bg-primary/10 text-primary text-[11px] font-bold tabular-nums shrink-0">
          {step.order}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-base-content/40">
          Step {step.order}
        </span>
      </div>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          className="btn btn-ghost btn-sm"
          onClick={onEdit}
          aria-label="Edit step"
        >
          <PencilIcon />
        </button>
        <button
          className="btn btn-ghost btn-sm text-error"
          onClick={onDelete}
          aria-label="Delete step"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-base-content/40 mb-1.5">
          Action
        </p>
        <p className="text-sm leading-relaxed text-base-content/85">
          {step.action}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-base-content/40 mb-1.5">
          Expected Result
        </p>
        <p className="text-sm leading-relaxed text-base-content/85">
          {step.expectedResult}
        </p>
      </div>
    </div>
    <p className="text-base-content/30 mt-4 text-xs tabular-nums">
      {formatDate(step.createdAt)}
    </p>
  </div>
);
