"use client";

type RoundTripToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Optional id for the checkbox (use when multiple toggles share state to avoid duplicate ids). */
  id?: string;
};

export function RoundTripToggle({
  checked,
  onChange,
  id = "round-trip",
}: RoundTripToggleProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 cursor-pointer select-none"
    >
      <span className="text-sm font-medium text-text">Round trip</span>
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          aria-hidden="true"
          className="w-10 h-5.5 bg-border rounded-full peer-checked:bg-primary
            peer-focus-visible:ring-2 peer-focus-visible:ring-primary-light/40
            transition-colors"
        />
        <div
          aria-hidden="true"
          className="absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-surface rounded-full
            shadow-sm transition-transform peer-checked:translate-x-[18px]"
        />
      </div>
    </label>
  );
}
