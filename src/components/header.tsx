import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINKS = [
  { href: "/", label: "Calculator" },
  { href: "/rates", label: "Rates" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
] as const;

export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-6">
        <Link href="/" className="text-lg font-bold text-primary shrink-0">
          IRS Mileage Calculator
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-5 text-sm"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-text-muted hover:text-primary transition-colors"
            >
              {label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
