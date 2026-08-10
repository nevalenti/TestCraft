import { AVAILABLE_EVENTS } from '@/features/notifications/notificationEvents';

export const EventCheckboxes = ({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) => {
  const toggle = (event: string) =>
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
