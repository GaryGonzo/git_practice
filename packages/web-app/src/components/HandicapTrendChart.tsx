interface TrendPoint {
  value: number;
  recordedAt: string;
}

const WIDTH = 300;
const HEIGHT = 100;
const PAD_X = 12;
const PAD_Y = 16;

// A small, single-series trend line -- no axes or gridlines (recessive to
// the point of absent, appropriate at this size), first/last points
// direct-labeled rather than every point, per the "selective labels"
// mark spec. Brand green throughout since direction (better/worse) is
// already carried by the delta badge next to this chart, not by color
// here -- this line is just shape.
export function HandicapTrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = PAD_X + (i / (points.length - 1)) * (WIDTH - PAD_X * 2);
    const y = HEIGHT - PAD_Y - ((p.value - min) / range) * (HEIGHT - PAD_Y * 2);
    return { x, y, value: p.value };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const first = coords[0];
  const last = coords[coords.length - 1];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-2 w-full" role="img" aria-label="Handicap trend over time">
      <path d={path} fill="none" stroke="#1F4D36" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={3} fill="#1F4D36" />
      ))}
      <text x={first.x} y={first.y - 8} textAnchor="start" fontSize={11} fill="#4B564E" className="font-body">
        {first.value}
      </text>
      <text x={last.x} y={last.y - 8} textAnchor="end" fontSize={11} fill="#4B564E" className="font-body">
        {last.value}
      </text>
    </svg>
  );
}
