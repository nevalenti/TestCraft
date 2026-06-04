import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { ArrowUpTrayIcon } from "@heroicons/react/24/solid";

export const ImportDropdown = ({
  onJUnit,
  onAllure,
}: {
  onJUnit: () => void;
  onAllure: () => void;
}) => (
  <div className="dropdown dropdown-end">
    <div tabIndex={0} role="button" className="btn btn-outline btn-sm gap-1.5">
      <ArrowUpTrayIcon className="size-4" />
      Import
      <ChevronDownIcon className="size-3 opacity-60" />
    </div>
    <ul className="dropdown-content menu bg-base-100 border-base-200 rounded-box z-10 mt-1 w-44 border p-1.5 shadow-lg">
      <li>
        <button
          type="button"
          onClick={() => {
            onJUnit();
            (document.activeElement as HTMLElement)?.blur();
          }}
        >
          JUnit XML
        </button>
      </li>
      <li>
        <button
          type="button"
          onClick={() => {
            onAllure();
            (document.activeElement as HTMLElement)?.blur();
          }}
        >
          Allure JSON
        </button>
      </li>
    </ul>
  </div>
);
