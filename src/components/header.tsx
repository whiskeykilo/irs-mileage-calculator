"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINKS = [
  { href: "/", label: "Calculator" },
  { href: "/rates", label: "Rates" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="text-lg font-bold text-primary shrink-0">
          IRS Mileage Calculator
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Main navigation"
          className="hidden sm:flex items-center gap-5 text-sm"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`transition-colors ${
                pathname === href
                  ? "text-primary font-medium"
                  : "text-text-muted hover:text-primary"
              }`}
            >
              {label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        {/* Mobile hamburger */}
        <div ref={menuRef} className="relative sm:hidden">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text hover:bg-surface-alt transition-colors"
          >
            {open ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-border bg-surface shadow-lg py-2">
              <nav aria-label="Mobile navigation">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`block px-4 py-2.5 text-sm transition-colors ${
                      pathname === href
                        ? "text-primary font-medium bg-primary/5"
                        : "text-text hover:bg-surface-alt"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-border mt-2 pt-2 px-4 flex items-center justify-between">
                <span className="text-xs text-text-muted">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
