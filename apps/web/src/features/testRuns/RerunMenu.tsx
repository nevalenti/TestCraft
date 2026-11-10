import {
  ArrowPathIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";

import { DropdownMenu } from "@/components/ui/DropdownMenu";

interface RerunMenuProps {
  failedCount: number;
  isPending: boolean;
  onRerun: (failedOnly: boolean) => void;
}

const ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-fg-secondary transition-colors hover:bg-base-content/6 hover:text-base-content disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent";

export const RerunMenu = ({
  failedCount,
  isPending,
  onRerun,
}: RerunMenuProps) => (
  <DropdownMenu
    label="Rerun options"
    className="dropdown-end"
    triggerClassName="btn gap-1.5 btn-outline btn-sm"
    menuClassName="z-10 mt-2 w-64 rounded-xl border border-border bg-base-100 p-1.5 shadow-popover"
    trigger={
      <>
        <ArrowPathIcon className="size-4" aria-hidden="true" />
        Rerun
        <ChevronDownIcon className="size-3.5" aria-hidden="true" />
      </>
    }
  >
    <li>
      <button
        type="button"
        className={ITEM_CLASS}
        disabled={isPending}
        onClick={() => onRerun(false)}
      >
        <ArrowPathIcon className="size-4 shrink-0" aria-hidden="true" />
        Rerun all tests
      </button>
    </li>
    <li>
      <button
        type="button"
        className={ITEM_CLASS}
        disabled={isPending || failedCount === 0}
        onClick={() => onRerun(true)}
      >
        <ExclamationTriangleIcon
          className="size-4 shrink-0 text-error"
          aria-hidden="true"
        />
        Rerun failed &amp; blocked ({failedCount})
      </button>
    </li>
  </DropdownMenu>
);
