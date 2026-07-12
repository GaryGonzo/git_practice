import { useState } from "react";
import type { Drill, SkillCategory } from "@golfable/shared";
import { CATEGORY_INFO } from "@golfable/shared";

interface DrillHeroImageProps {
  drill: Drill;
}

const CATEGORY_BG: Record<SkillCategory, string> = {
  driver: "bg-driver",
  irons: "bg-irons",
  wedges: "bg-wedges",
  putter: "bg-putter",
};

const CATEGORY_TEXT: Record<SkillCategory, string> = {
  driver: "text-driver",
  irons: "text-irons",
  wedges: "text-wedges",
  putter: "text-putter",
};

const CATEGORY_FALLBACK_COUNT = 2;

// Deterministic per-drill pick so the same drill always shows the same
// fallback photo instead of jumping around between renders.
function fallbackIndexFor(drillId: string): number {
  let sum = 0;
  for (let i = 0; i < drillId.length; i++) sum += drillId.charCodeAt(i);
  return (sum % CATEGORY_FALLBACK_COUNT) + 1;
}

// Renders the drill's photo -- a real per-drill photo if one exists at
// /drills/<id>.jpg, else a shared category stock photo -- with the drill's
// title block (badge + category + name) overlaid on top, so the photo and
// its caption read as one unit instead of a photo followed by a duplicate
// title underneath. If no photo exists at all yet, falls back to the same
// title block rendered plainly, so the drill name is never lost.
export function DrillHeroImage({ drill }: DrillHeroImageProps) {
  const [stage, setStage] = useState<"drill" | "category" | "none">("drill");
  const info = CATEGORY_INFO[drill.category];

  const badge = (
    <div
      className={`font-display flex h-9 w-9 flex-none items-center justify-center rounded-full text-base text-white ${CATEGORY_BG[drill.category]}`}
    >
      {info.badge}
    </div>
  );

  if (stage === "none") {
    return (
      <div className="mb-4 flex items-center gap-2.5">
        {badge}
        <div>
          <p
            className={`font-label text-sm font-semibold tracking-wide uppercase ${CATEGORY_TEXT[drill.category]}`}
          >
            {info.label}
          </p>
          <h1 className="font-display text-2xl tracking-wide">{drill.name}</h1>
        </div>
      </div>
    );
  }

  const src =
    stage === "drill" ? `/drills/${drill.id}.jpg` : `/categories/${drill.category}-${fallbackIndexFor(drill.id)}.jpg`;

  if (drill.videoUrl) {
    return (
      <div className="relative mb-4 w-full overflow-hidden rounded-lg bg-black">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2.5 bg-gradient-to-b from-black/70 to-transparent px-3 py-3">
          {badge}
          <div>
            <p className="font-label text-sm font-semibold tracking-wide text-white/85 uppercase">{info.label}</p>
            <h1 className="font-display text-2xl tracking-wide text-white">{drill.name}</h1>
          </div>
        </div>
        <video src={drill.videoUrl} poster={src} controls preload="none" className="aspect-video w-full">
          Your browser doesn't support embedded video.
        </video>
      </div>
    );
  }

  return (
    <div className="relative mb-4 h-40 w-full overflow-hidden rounded-lg">
      <img
        src={src}
        alt={drill.name}
        onError={() => setStage(stage === "drill" ? "category" : "none")}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 py-3">
        {badge}
        <div>
          <p className="font-label text-sm font-semibold tracking-wide text-white/85 uppercase">{info.label}</p>
          <h1 className="font-display text-2xl tracking-wide text-white">{drill.name}</h1>
        </div>
      </div>
    </div>
  );
}
