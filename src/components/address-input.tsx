"use client";

import { useRef, useEffect, useCallback } from "react";
import { useGoogleMaps } from "./google-maps-loader";

type AddressInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (address: string) => void;
  id: string;
};

export function AddressInput({
  label,
  placeholder,
  value,
  onChange,
  onPlaceSelected,
  id,
}: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { loaded } = useGoogleMaps();

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.formatted_address) {
      onPlaceSelected(place.formatted_address);
    } else if (place?.name) {
      onPlaceSelected(place.name);
    }
  }, [onPlaceSelected]);

  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["geocode", "establishment"],
        fields: ["formatted_address", "name"],
      },
    );

    autocomplete.addListener("place_changed", handlePlaceChanged);
    autocompleteRef.current = autocomplete;

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [loaded, handlePlaceChanged]);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
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
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm
          placeholder:text-text-muted/60 focus:outline-none focus:ring-2
          focus:ring-primary-light/40 focus:border-primary-light transition-shadow"
      />
    </div>
  );
}
