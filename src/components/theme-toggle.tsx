"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

function applyTheme(theme: Theme) {
  const dark =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : theme === "dark";
  document.documentElement.classList.toggle("dark", dark);
}

const THEMES: { value: Theme; Icon: typeof Sun; label: string }[] = [
  { value: "light", Icon: Sun, label: "Light" },
  { value: "dark", Icon: Moon, label: "Dark" },
  { value: "system", Icon: Monitor, label: "System" },
];

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setThemeState(getStoredTheme());
    setMounted(true);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    applyTheme(next);
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!mounted) {
    return (
      <div
        className="h-8 w-10 rounded border border-border bg-surface"
        aria-hidden
      />
    );
  }

  const current = THEMES.find((t) => t.value === theme)!;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Theme: ${current.label}. Choose theme`}
        title={`Theme: ${current.label}`}
        className="flex h-8 w-10 items-center justify-center rounded border border-border bg-surface text-text hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary-light/40"
      >
        <current.Icon className="size-4" aria-hidden />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Theme"
          className="absolute right-0 top-full z-50 mt-1 flex gap-0.5 rounded border border-border bg-surface p-0.5 shadow-lg"
        >
          {THEMES.map(({ value, Icon, label }) => (
            <li key={value} role="option" aria-selected={theme === value}>
              <button
                type="button"
                onClick={() => setTheme(value)}
                title={label}
                className={`flex h-8 w-8 items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-primary-light/40 ${
                  theme === value
                    ? "bg-primary text-white"
                    : "text-text hover:bg-surface-alt"
                }`}
              >
                <Icon className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
