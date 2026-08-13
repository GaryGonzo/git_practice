// Phone cameras don't expose their real field of view through any web API,
// so this is a calibratable estimate rather than a measured value. Most
// modern phones' main rear lens is roughly 55-65 degrees horizontal in
// video mode -- 60 is a reasonable middle default.
export const DEFAULT_FOV_DEG = 60;
export const FOV_STORAGE_KEY = "golfable_camera_fov_deg";

export function loadCalibratedFovDeg(): number {
  const stored = Number(localStorage.getItem(FOV_STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_FOV_DEG;
}

export function saveCalibratedFovDeg(fovDeg: number): void {
  localStorage.setItem(FOV_STORAGE_KEY, String(fovDeg));
}

interface FairwayLines {
  // 0-100, position of each boundary line as a percentage of frame width.
  leftPercent: number;
  rightPercent: number;
  // Half of the fairway's angular width, in degrees -- shown to the user
  // for transparency, and used to detect when it exceeds the camera's FOV.
  halfAngleDeg: number;
  // True once the fairway is wider than the camera can show at this
  // distance, so the lines have been clamped to the frame edges.
  clipped: boolean;
}

// Standard rectilinear (non-fisheye) camera projection: a real-world angle
// off the center of the lens maps to screen position via the ratio of
// tangents, not linearly -- this stays accurate as the angle grows, unlike
// a naive angle/FOV linear interpolation.
export function computeFairwayLines(widthYards: number, distanceYards: number, fovDeg: number): FairwayLines {
  const halfAngleRad = Math.atan(widthYards / 2 / distanceYards);
  const halfFovRad = (fovDeg / 2) * (Math.PI / 180);

  const fraction = Math.tan(halfAngleRad) / Math.tan(halfFovRad);
  const clipped = fraction > 1;
  const clamped = Math.min(fraction, 1);

  return {
    leftPercent: 50 - clamped * 50,
    rightPercent: 50 + clamped * 50,
    halfAngleDeg: halfAngleRad * (180 / Math.PI),
    clipped,
  };
}
