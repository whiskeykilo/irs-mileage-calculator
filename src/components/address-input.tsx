"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useGoogleMaps } from "./google-maps-loader";

type AddressInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (address: string) => void;
  id: string;
  headerRight?: React.ReactNode;
};

const inputClassName =
  "w-full rounded-lg border border-border bg-surface text-text px-3 py-2.5 text-sm " +
  "placeholder:text-text-muted/60 focus:outline-none focus:ring-2 " +
  "focus:ring-primary-light/40 focus:border-primary-light transition-shadow";

/**
 * Controlled address input. Uses the new Places Autocomplete Data API
 * (AutocompleteSuggestion.fetchAutocompleteSuggestions) so suggestions appear
 * in a dropdown and selection fills the formatted address. Replaces the
 * deprecated google.maps.places.Autocomplete widget.
 */
export function AddressInput({
  label,
  placeholder,
  value,
  onChange,
  onPlaceSelected,
  id,
  headerRight,
}: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { loaded } = useGoogleMaps();
  type SuggestionItem = {
    text: string;
    placePrediction: {
      toPlace?: () =>
        | {
            fetchFields?: (opts: {
              fields: string[];
            }) => Promise<{ formattedAddress?: string }>;
          }
        | Promise<{
            fetchFields?: (opts: {
              fields: string[];
            }) => Promise<{ formattedAddress?: string }>;
          }>;
    };
  };
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const sessionTokenRef = useRef<unknown>(null);
  const justSelectedRef = useRef(false);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!window.google?.maps?.places || !input.trim()) {
      setSuggestions([]);
      return;
    }
    const places = window.google.maps.places as unknown as {
      AutocompleteSessionToken?: new () => unknown;
      AutocompleteSuggestion?: {
        fetchAutocompleteSuggestions: (req: {
          input: string;
          sessionToken?: unknown;
        }) => Promise<{ suggestions: unknown[] }>;
      };
    };
    const SessionToken = places.AutocompleteSessionToken;
    const fetchApi =
      places.AutocompleteSuggestion?.fetchAutocompleteSuggestions;
    if (!SessionToken || !fetchApi) {
      setSuggestions([]);
      return;
    }
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new SessionToken();
    }
    try {
      const { suggestions: raw } = await fetchApi({
        input: input.trim(),
        sessionToken: sessionTokenRef.current,
      });
      const list = (raw ?? []) as {
        placePrediction?: {
          text?: { text?: string };
          toPlace?: () =>
            | {
                fetchFields?: (opts: {
                  fields: string[];
                }) => Promise<{ formattedAddress?: string }>;
              }
            | Promise<{
                fetchFields?: (opts: {
                  fields: string[];
                }) => Promise<{ formattedAddress?: string }>;
              }>;
        };
      }[];
      const items: SuggestionItem[] = list
        .filter(
          (
            s,
          ): s is typeof s & {
            placePrediction: NonNullable<typeof s.placePrediction>;
          } => Boolean(s.placePrediction?.text?.text),
        )
        .map((s) => ({
          text: s.placePrediction.text!.text!,
          placePrediction: s.placePrediction,
        }));
      setSuggestions(items);
      setHighlightIndex(-1);
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const places = window.google?.maps?.places as unknown as {
      AutocompleteSessionToken?: new () => unknown;
    };
    if (places?.AutocompleteSessionToken) {
      sessionTokenRef.current = new places.AutocompleteSessionToken();
    }
  }, [loaded]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!loaded || !value.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      fetchSuggestions(value);
      setOpen(true);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loaded, value, fetchSuggestions]);

  const selectPlace = useCallback(
    async (item: SuggestionItem) => {
      justSelectedRef.current = true;
      setOpen(false);
      setSuggestions([]);
      try {
        const placeLike = item.placePrediction.toPlace?.();
        if (!placeLike) {
          onPlaceSelected(item.text);
          return;
        }
        const place = await Promise.resolve(placeLike);
        const data = place?.fetchFields
          ? await place.fetchFields({ fields: ["formattedAddress"] })
          : undefined;
        const addr = (data?.formattedAddress ?? item.text).trim();
        if (addr) onPlaceSelected(addr);
        else onPlaceSelected(item.text);
        sessionTokenRef.current = null;
        const places = window.google?.maps?.places as unknown as {
          AutocompleteSessionToken?: new () => unknown;
        };
        if (places?.AutocompleteSessionToken)
          sessionTokenRef.current = new places.AutocompleteSessionToken();
      } catch {
        onPlaceSelected(item.text);
      }
    },
    [onPlaceSelected],
  );

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (el.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      return;
    }
    if (
      e.key === "Enter" &&
      highlightIndex >= 0 &&
      suggestions[highlightIndex]
    ) {
      e.preventDefault();
      selectPlace(suggestions[highlightIndex]);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setHighlightIndex(-1);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
        </label>
        {headerRight}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value.trim() && suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
        className={inputClassName}
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={open ? `${id}-listbox` : undefined}
        role="combobox"
      />
      {open && suggestions.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg py-1 max-h-60 overflow-auto"
        >
          {suggestions.map((item, i) => (
            <li
              key={i}
              role="option"
              aria-selected={i === highlightIndex}
              className={`px-3 py-2 text-sm cursor-pointer ${
                i === highlightIndex
                  ? "bg-primary-light/20 text-primary-dark"
                  : "text-text hover:bg-surface-alt"
              }`}
              onMouseEnter={() => setHighlightIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                selectPlace(item);
              }}
            >
              {item.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
