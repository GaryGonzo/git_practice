import type { SkillCategory } from "@golfable/shared";

interface CategoryIconProps {
  category: SkillCategory;
  className?: string;
}

// A small glyph per category, evocative of what that club is actually for
// rather than a club silhouette (which reads too similarly across iron/
// wedge/putter at badge size): distance for Driver, precision for Irons,
// loft/touch for Wedges, the hole itself for Putter.
export function CategoryIcon({ category, className }: CategoryIconProps) {
  switch (category) {
    case "driver":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M6 18L17 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10 7h7v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "irons":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        </svg>
      );
    case "wedges":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M4 17c1.8-6.5 5.6-10 8-10s6.2 3.5 8 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "putter":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <ellipse cx="11" cy="19" rx="6" ry="1.6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9 19V5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 6l6.5 2.75L9 11.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
  }
}
