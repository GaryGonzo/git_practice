// Golfable's public contact inbox (same address as the Terms and Studios pages).
export const GOLFABLE_CONTACT_EMAIL = "golfable541@gmail.com";
export const FIT_ACCESS_CONTACT_EMAIL = GOLFABLE_CONTACT_EMAIL;
export const FIT_ACCESS_MAILTO = `mailto:${FIT_ACCESS_CONTACT_EMAIL}?subject=${encodeURIComponent(
  "Golfable Fit access request",
)}&body=${encodeURIComponent("Hi Gary, I'd love to try Golfable Fit. Could you give my account access?\n\nThe email on my Golfable account: ")}`;
