import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CTAButton } from "./ui";

const LINKS = [
  { to: "/how-it-works", label: "How It Works" },
  { to: "/buildout", label: "6-Week Buildout" },
  { to: "/whats-included", label: "What's Included" },
  { to: "/guarantee", label: "Guarantee" },
  { to: "/results", label: "Results" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-sand/70 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-6">
        <Link to="/" className="flex shrink-0 flex-col leading-tight" onClick={() => setOpen(false)}>
          <span className="whitespace-nowrap font-display text-base text-fairway-dark sm:text-lg">
            OGG Course Growth
          </span>
          <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.16em] text-ink/50">
            Oregon Golf Guide
          </span>
        </Link>

        <nav className="hidden min-w-0 items-center gap-4 xl:flex xl:gap-5">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `whitespace-nowrap text-sm font-medium transition-colors hover:text-fairway-dark ${
                  isActive ? "text-fairway-dark" : "text-ink/60"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 xl:block">
          <CTAButton to="/apply" variant="primary" className="!px-5 !py-2.5 !text-sm whitespace-nowrap">
            Apply for a Call
          </CTAButton>
        </div>

        <button
          className="shrink-0 text-fairway-dark xl:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-sand/70 bg-cream xl:hidden">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-6 py-4">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-ink/70 hover:text-fairway-dark"
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/apply"
              onClick={() => setOpen(false)}
              className="mt-2 inline-block bg-gold px-5 py-2.5 text-center text-sm font-semibold text-fairway-dark"
            >
              Apply for a Call
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
