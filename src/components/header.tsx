import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Calculator" },
  { href: "/rates", label: "Rates" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
] as const;

export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-primary">
          IRS Mileage Calculator
        </Link>
        <nav className="flex gap-4 text-sm">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-text-muted hover:text-primary transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
