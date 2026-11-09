import type { NotificationEvent } from "@testcraft/types";

import {
  AVAILABLE_EVENTS,
  NOTIFICATION_EVENT_LABELS,
} from "@/features/notifications/notificationEvents";

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
    <div role="group" aria-label="Events" className="flex flex-wrap gap-3">
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
          {NOTIFICATION_EVENT_LABELS[ev]}
        </label>
      ))}
    </div>
  );
};
