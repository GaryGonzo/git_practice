import { useState } from "react";

interface DrillHeroImageProps {
  drillId: string;
  alt: string;
}

// Looks for /drills/<drillId>.jpg in public/. If it's not there yet
// (real photos get added one at a time, per drill), it just renders
// nothing rather than a broken image.
export function DrillHeroImage({ drillId, alt }: DrillHeroImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <img
      src={`/drills/${drillId}.jpg`}
      alt={alt}
      onError={() => setFailed(true)}
      className="mb-4 h-40 w-full rounded-lg object-cover"
    />
  );
}
