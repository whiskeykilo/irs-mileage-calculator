"use client";

import { useRef, useEffect } from "react";
import { useGoogleMaps } from "./google-maps-loader";

type AddressInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (address: string) => void;
  id: string;
};

const inputClassName =
  "w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5 text-sm " +
  "placeholder:text-text-muted/60 focus:outline-none focus:ring-2 " +
  "focus:ring-primary-light/40 focus:border-primary-light transition-shadow";

/**
 * Single controlled input for address. Typing updates React state so the calculator
 * can run as soon as both fields have text. When Maps is loaded we attach the
 * legacy Autocomplete to the same input so suggestions appear and selection
 * fills the formatted address.
 */
export function AddressInput({
  label,
  placeholder,
  value,
  onChange,
  onPlaceSelected,
  id,
}: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { loaded } = useGoogleMaps();

  useEffect(() => {
    if (!loaded || !inputRef.current || !window.google?.maps?.places) return;

    const Autocomplete = (
      window.google.maps.places as unknown as {
        Autocomplete?: new (
          input: HTMLInputElement,
          opts?: { types?: string[] },
        ) => {
          getPlace: () => {
            formatted_address?: string;
            name?: string;
          };
          addListener: (event: string, fn: () => void) => void;
        };
      }
    ).Autocomplete;

    if (!Autocomplete) return;

    const autocomplete = new Autocomplete(inputRef.current, {
      types: ["geocode", "establishment"],
    });

    const handler = () => {
      const place = autocomplete.getPlace();
      const addr = (place?.formatted_address ?? place?.name ?? "").trim() || "";
      if (addr) onPlaceSelected(addr);
    };

    const listener = window.google.maps.event.addListener(
      autocomplete,
      "place_changed",
      handler,
    );

    return () => {
      window.google.maps.event.removeListener(listener);
      window.google.maps.event.clearInstanceListeners(autocomplete);
      if (inputRef.current) {
        window.google.maps.event.clearInstanceListeners(inputRef.current);
      }
    };
  }, [loaded, onPlaceSelected]);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text mb-1.5">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        className={inputClassName}
      />
    </div>
  );
}
