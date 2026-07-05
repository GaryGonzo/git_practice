export const SKILL_CATEGORIES = ["driver", "irons", "wedges", "putter"] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export interface CategoryInfo {
  badge: string;
  label: string;
  color: string;
}

export const CATEGORY_INFO: Record<SkillCategory, CategoryInfo> = {
  driver: { badge: "D", label: "Driver & Woods", color: "#185FA5" },
  irons: { badge: "I", label: "Irons", color: "#3B6D11" },
  wedges: { badge: "W", label: "Wedges", color: "#1D9E75" },
  putter: { badge: "P", label: "Putter", color: "#BA7517" },
};

export const HANDICAP_TIERS = ["scratch", "low", "mid", "high"] as const;
export type HandicapTier = (typeof HANDICAP_TIERS)[number];

export interface TierInfo {
  label: string;
  sublabel: string;
}

export const TIER_INFO: Record<HandicapTier, TierInfo> = {
  scratch: { label: "Scratch+", sublabel: "Scratch or better" },
  low: { label: "Low", sublabel: "1-9" },
  mid: { label: "Mid", sublabel: "10-18" },
  high: { label: "High", sublabel: "19-36" },
};

export const BRAND_FONTS = {
  display: "'Bebas Neue', sans-serif",
  label: "'Barlow Condensed', sans-serif",
  body: "'Barlow', sans-serif",
} as const;

export const CARD_DIMENSIONS = {
  width: 310,
  height: 388,
} as const;

export const CAPTION_HASHTAGS = "#golfable #golftok #golfpractice #loweryourhandicap";
