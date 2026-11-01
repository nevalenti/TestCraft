import type { NotificationEvent } from "@testcraft/types";

import { AVAILABLE_EVENTS } from "@/features/notifications/notificationEvents";

interface EventCheckboxesProps {
  selected: NotificationEvent[];
  onChange: (next: NotificationEvent[]) => void;
}

export const EventCheckboxes = ({
  selected,
  onChange,
}: EventCheckboxesProps) => {
  const toggle = (event: NotificationEvent) =>
    onChange(
      selected.includes(event)
        ? selected.filter((selectedEvent) => selectedEvent !== event)
        : [...selected, event],
    );

  return (
    <div className="flex flex-wrap gap-3">
      {AVAILABLE_EVENTS.map((ev) => (
        <label
          key={ev}
          className="flex cursor-pointer items-center gap-1.5 text-sm"
        >
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={selected.includes(ev)}
            onChange={() => toggle(ev)}
          />
          {ev}
        </label>
      ))}
    </div>
  );
};
