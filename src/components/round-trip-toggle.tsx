"use client";

type RoundTripToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function RoundTripToggle({ checked, onChange }: RoundTripToggleProps) {
  return (
    <label
      htmlFor="round-trip"
      className="flex items-center gap-2.5 cursor-pointer select-none"
    >
      <div className="relative">
        <input
          type="checkbox"
          id="round-trip"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className="w-10 h-5.5 bg-border rounded-full peer-checked:bg-primary
            peer-focus-visible:ring-2 peer-focus-visible:ring-primary-light/40
            transition-colors"
        />
        <div
          className="absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full
            shadow-sm transition-transform peer-checked:translate-x-[18px]"
        />
      </div>
      <span className="text-sm font-medium">Round trip</span>
    </label>
  );
}
