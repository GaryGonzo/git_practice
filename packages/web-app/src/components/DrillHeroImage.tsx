import { useState } from "react";
import type { SkillCategory } from "@golfable/shared";
import { CATEGORY_INFO } from "@golfable/shared";

interface DrillHeroImageProps {
  drillId: string;
  category: SkillCategory;
  alt: string;
}

const CATEGORY_FALLBACK_COUNT = 2;

// Deterministic per-drill pick so the same drill always shows the same
// fallback photo instead of jumping around between renders.
function fallbackIndexFor(drillId: string): number {
  let sum = 0;
  for (let i = 0; i < drillId.length; i++) sum += drillId.charCodeAt(i);
  return (sum % CATEGORY_FALLBACK_COUNT) + 1;
}

// Looks for /drills/<drillId>.jpg first -- real, unique photos get added
// one at a time, per drill. Until then, falls back to a shared category
// stock photo (with a branded label overlay, since a generic stock shot
// benefits from the reminder of what it's standing in for) so the card
// never shows blank. If even that's missing, renders nothing.
export function DrillHeroImage({ drillId, category, alt }: DrillHeroImageProps) {
  const [stage, setStage] = useState<"drill" | "category" | "none">("drill");
  if (stage === "none") return null;

  const info = CATEGORY_INFO[category];
  const src =
    stage === "drill" ? `/drills/${drillId}.jpg` : `/categories/${category}-${fallbackIndexFor(drillId)}.jpg`;

  return (
    <div className="relative mb-4 h-40 w-full overflow-hidden rounded-lg">
      <img
        src={src}
        alt={alt}
        onError={() => setStage(stage === "drill" ? "category" : "none")}
        className="h-full w-full object-cover"
      />
      {stage === "category" && (
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-3 py-2.5">
          <span
            className="font-display flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs text-white"
            style={{ backgroundColor: info.color }}
          >
            {info.badge}
          </span>
          <span className="font-label text-sm font-semibold tracking-wide text-white uppercase">
            {info.label}
          </span>
        </div>
      )}
    </div>
  );
}
