import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="mx-auto max-w-3xl px-4 py-4 text-center text-sm text-text-muted">
        <nav
          aria-label="Footer navigation"
          className="flex justify-center items-center gap-3 flex-wrap"
        >
          <span>&copy; {new Date().getFullYear()}</span>
          <span className="text-border">·</span>
          <Link
            href="/privacy"
            className="hover:text-primary transition-colors"
          >
            Privacy
          </Link>
          <span className="text-border">·</span>
          <a
            href="https://github.com/whiskeykilo/irs-mileage-calculator"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
