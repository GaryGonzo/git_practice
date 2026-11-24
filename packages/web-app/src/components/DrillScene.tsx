import { useEffect, useState } from "react";
import type { Scene, SceneItem, SceneShot } from "@golfable/shared";
import { Dimples, poseTiming } from "./Dimples";

// The animated "course map" for a drill: a top-down picture of the setup
// with Dimples in the corner making the stroke. Each ball rolls (putts) or
// flies (full shots) on his impact, drops in the cup or puffs where it
// lands, and the scene replays. Body-only drills skip the map and put
// Dimples center stage. Everything is SVG + SMIL/CSS, so it's
// tiny, crisp at any size and needs no video.

const W = 340;
const H = 210;
const px = (x: number) => 10 + x * 3.2;
const py = (y: number) => 9 + y * 3.2;

const INK = "#14201b";
const SHOT_SECONDS = 1.1;

function Background({ set }: { set: Scene["set"] }) {
  switch (set) {
    case "room":
      return (
        <g>
          <rect width={W} height={H} fill="#d8b98b" />
          {Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1={0} y1={i * 26} x2={W} y2={i * 26} stroke="#c9a676" strokeWidth={1.5} />
          ))}
          <rect x={60} y={14} width={220} height={186} rx={10} fill="#6f8f7a" stroke="#58776a" strokeWidth={6} />
          <rect x={72} y={26} width={196} height={162} rx={6} fill="none" stroke="#86a691" strokeWidth={2} strokeDasharray="2 6" />
        </g>
      );
    case "green":
      return (
        <g>
          <rect width={W} height={H} fill="#3f8a5a" />
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} x={i * 52} y={0} width={26} height={H} fill="#4a9765" />
          ))}
          <rect width={W} height={10} fill="#2f6b4a" />
        </g>
      );
    case "range":
      return (
        <g>
          <rect width={W} height={H} fill="#4f9a66" />
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={i} x={0} y={i * 36} width={W} height={18} fill="#5aa673" />
          ))}
          <rect x={120} y={182} width={100} height={28} rx={3} fill="#2f6b4a" />
          <rect x={124} y={186} width={92} height={20} rx={2} fill="#3b7d57" />
        </g>
      );
    case "chip":
      return (
        <g>
          <rect width={W} height={H} fill="#4f9a66" />
          <ellipse cx={170} cy={70} rx={150} ry={74} fill="#3f8a5a" />
          <ellipse cx={170} cy={70} rx={150} ry={74} fill="none" stroke="#2f6b4a" strokeWidth={5} />
        </g>
      );
    case "garage":
      return (
        <g>
          <rect width={W} height={H} fill="#d2cdc3" />
          <rect width={W} height={70} fill="#bfb8ab" />
          <line x1={0} y1={70} x2={W} y2={70} stroke="#a9a193" strokeWidth={3} />
          <rect x={110} y={120} width={120} height={80} rx={4} fill="#3b7d57" stroke="#2f6b4a" strokeWidth={3} />
        </g>
      );
    case "net":
      return (
        <g>
          <rect width={W} height={H} fill="#cfcac0" />
          <rect x={40} y={8} width={260} height={110} rx={6} fill="#2a2f2d" />
          <g stroke="#4a524f" strokeWidth={1}>
            {Array.from({ length: 13 }, (_, i) => (
              <line key={`v${i}`} x1={40 + i * 20} y1={8} x2={40 + i * 20} y2={118} />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <line key={`h${i}`} x1={40} y1={8 + i * 20} x2={300} y2={8 + i * 20} />
            ))}
          </g>
          <rect x={120} y={150} width={100} height={52} rx={4} fill="#3b7d57" stroke="#2f6b4a" strokeWidth={3} />
        </g>
      );
    case "body":
      return (
        <g>
          <rect width={W} height={H} fill="#f6efdc" />
          <rect y={166} width={W} height={44} fill="#ebdfbf" />
        </g>
      );
  }
}

function Label({ x, y, text, dark }: { x: number; y: number; text: string; dark?: boolean }) {
  const w = text.length * 6.2 + 12;
  return (
    <g>
      <rect x={x - w / 2} y={y - 8} width={w} height={15} rx={7.5} fill={dark ? INK : "#fff"} opacity={0.88} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={10.5} fontWeight={600} fontFamily="'Barlow Condensed', sans-serif" fill={dark ? "#fff" : INK}>
        {text}
      </text>
    </g>
  );
}

function Item({ item }: { item: SceneItem }) {
  const x = px(item.x);
  const y = py(item.y);
  switch (item.k) {
    case "cup":
      return (
        <g>
          <ellipse cx={x} cy={y} rx={9} ry={7} fill="#fff" />
          <ellipse cx={x} cy={y + 0.5} rx={7} ry={5.4} fill={INK} />
          {item.label && <Label x={x} y={y - 16} text={item.label} />}
        </g>
      );
    case "mug":
      return (
        <g>
          <rect x={x - 11} y={y - 12} width={22} height={18} rx={4} fill="#c6564b" stroke={INK} strokeWidth={2} />
          <ellipse cx={x} cy={y + 6} rx={11} ry={4.5} fill={INK} />
          <path d={`M${x + 11} ${y - 7} q9 3 0 9`} fill="none" stroke={INK} strokeWidth={2.4} />
          {item.label && <Label x={x} y={y - 22} text={item.label} />}
        </g>
      );
    case "coin":
      return <circle cx={x} cy={y} r={4.6} fill="#d9b44a" stroke="#9c7d26" strokeWidth={1.4} />;
    case "tee":
      return (
        <g>
          <circle cx={x} cy={y} r={3.6} fill="#fff" stroke={INK} strokeWidth={1.4} />
          <circle cx={x} cy={y} r={1.2} fill={INK} />
        </g>
      );
    case "ball":
      return <circle cx={x} cy={y} r={4.4} fill="#fff" stroke={INK} strokeWidth={1.6} />;
    case "flag":
      return (
        <g>
          <ellipse cx={x} cy={y + 2} rx={5} ry={3.6} fill={INK} />
          <line x1={x} y1={y + 2} x2={x} y2={y - 22} stroke="#f4f1e8" strokeWidth={2} />
          <path d={`M${x} ${y - 22} l14 4.5 l-14 4.5 Z`} fill="#c6a64b" stroke={INK} strokeWidth={1.2} />
          {item.label && <Label x={x} y={y + 14} text={item.label} />}
        </g>
      );
    case "mirror":
      return (
        <g>
          <rect x={x - 26} y={y - 9} width={52} height={18} rx={4} fill="#cfe4ef" stroke={INK} strokeWidth={2} />
          <line x1={x - 22} y1={y} x2={x + 22} y2={y} stroke="#8fb3c4" strokeWidth={1.5} />
          {item.label && <Label x={x} y={y - 18} text={item.label} />}
        </g>
      );
    case "basket":
      return (
        <g>
          <circle cx={x} cy={y} r={16} fill="#2a2f2d" stroke={INK} strokeWidth={2} />
          <g stroke="#59625f" strokeWidth={1}>
            <line x1={x - 14} y1={y} x2={x + 14} y2={y} />
            <line x1={x} y1={y - 14} x2={x} y2={y + 14} />
            <circle cx={x} cy={y} r={8} fill="none" />
          </g>
          {item.label && <Label x={x} y={y - 24} text={item.label} />}
        </g>
      );
    case "mark":
      return (
        <g>
          <circle cx={x} cy={y} r={3.2} fill="#fff" opacity={0.9} />
          {item.label && <Label x={x + (item.label.length * 3.1 + 14)} y={y} text={item.label} />}
        </g>
      );
    case "zone":
      return (
        <g>
          <circle cx={x} cy={y} r={item.r * 3.2} fill="#fff" opacity={0.14} stroke="#fff" strokeWidth={1.6} strokeDasharray="5 4" />
          {item.label && <Label x={x + item.r * 3.2 + 16} y={y - item.r * 1.6} text={item.label} />}
        </g>
      );
    case "stick":
      return (
        <g>
          <line x1={x} y1={y} x2={px(item.x2)} y2={py(item.y2)} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <line x1={x} y1={y} x2={px(item.x2)} y2={py(item.y2)} stroke="#f08a24" strokeWidth={4} strokeLinecap="round" />
          {item.label && <Label x={(x + px(item.x2)) / 2} y={(y + py(item.y2)) / 2 - 11} text={item.label} />}
        </g>
      );
    case "line":
      return (
        <g>
          <line x1={x} y1={y} x2={px(item.x2)} y2={py(item.y2)} stroke="#fff" strokeWidth={2.4} strokeDasharray="7 6" opacity={0.9} />
          {item.label && <Label x={(x + px(item.x2)) / 2} y={(y + py(item.y2)) / 2} text={item.label} dark />}
        </g>
      );
    case "towel":
      return (
        <g>
          <rect x={x} y={y - 7} width={px(item.x2) - x} height={14} rx={2} fill="#f7f4ec" stroke={INK} strokeWidth={1.6} />
          <line x1={x + 4} y1={y - 3} x2={px(item.x2) - 4} y2={y - 3} stroke="#c6564b" strokeWidth={1.6} />
          <line x1={x + 4} y1={y + 3} x2={px(item.x2) - 4} y2={y + 3} stroke="#c6564b" strokeWidth={1.6} />
        </g>
      );
    case "wall":
      return (
        <g>
          <line x1={x} y1={y} x2={px(item.x2)} y2={py(item.y2)} stroke="#8a7a62" strokeWidth={10} strokeLinecap="square" />
          {item.label && <Label x={(x + px(item.x2)) / 2 + (item.x === item.x2 ? 26 : 0)} y={(y + py(item.y2)) / 2 + (item.x === item.x2 ? 0 : 16)} text={item.label} />}
        </g>
      );
  }
}

function shotPath(s: SceneShot): string {
  const [x1, y1] = [px(s.from[0]), py(s.from[1])];
  const [x2, y2] = [px(s.to[0]), py(s.to[1])];
  if (!s.air) return `M${x1} ${y1} L${x2} ${y2}`;
  // A gentle bend reads as ball flight from above.
  const cx = (x1 + x2) / 2 + (x2 >= x1 ? -14 : 14);
  const cy = (y1 + y2) / 2;
  return `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`;
}

function Shot({ shot, begin, sinks }: { shot: SceneShot; begin: number; sinks: boolean }) {
  const d = shotPath(shot);
  const dur = `${SHOT_SECONDS}s`;
  const land = begin + SHOT_SECONDS;
  const [tx, ty] = [px(shot.to[0]), py(shot.to[1])];
  return (
    <g>
      <path d={d} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="3 5" opacity={0}>
        <set attributeName="opacity" to="0.75" begin={`${begin}s`} fill="freeze" />
      </path>
      {shot.air && (
        <>
          <circle r={4} fill="#000" opacity={0}>
            <set attributeName="opacity" to="0.18" begin={`${begin}s`} fill="freeze" />
            <animateMotion dur={dur} begin={`${begin}s`} fill="freeze" path={d} keyTimes="0;1" keySplines="0.3 0 0.4 1" calcMode="spline" />
          </circle>
          {/* A puff where it lands. */}
          <circle cx={tx} cy={ty} r={3} fill="none" stroke="#fff" strokeWidth={2} opacity={0}>
            <animate attributeName="r" from="3" to="14" dur="0.5s" begin={`${land}s`} fill="freeze" />
            <animate attributeName="opacity" values="0.9;0" dur="0.5s" begin={`${land}s`} fill="freeze" />
          </circle>
        </>
      )}
      <g opacity={0}>
        <set attributeName="opacity" to="1" begin={`${Math.max(0, begin - 0.8)}s`} fill="freeze" />
        <circle r={shot.air ? 4.6 : 4.4} fill="#fff" stroke={INK} strokeWidth={1.6} cx={0} cy={0}>
          {shot.air && <animate attributeName="r" values="4.6;8;4.6" dur={dur} begin={`${begin}s`} fill="freeze" />}
          {/* Drops in the cup. */}
          {sinks && <animate attributeName="r" to="0" dur="0.18s" begin={`${land - 0.05}s`} fill="freeze" />}
        </circle>
        <animateMotion dur={dur} begin={`${begin}s`} fill="freeze" path={d} keyTimes="0;1" keySplines={shot.air ? "0.3 0 0.4 1" : "0.15 0.6 0.35 1"} calcMode="spline" />
        {/* Sit at the start until it's this ball's turn. */}
        <animateMotion dur="0.01s" begin="0s" fill="freeze" path={`M${px(shot.from[0])} ${py(shot.from[1])} L${px(shot.from[0])} ${py(shot.from[1])}`} />
      </g>
    </g>
  );
}

/** When each ball leaves: on Dimples' impact, one per stroke. */
function shotBegins(scene: Scene): number[] {
  const { dur, impact } = poseTiming(scene.pose);
  return (scene.shots ?? []).map((_, i) => impact + i * dur);
}

/** How long one pass of the scene runs before it replays. */
export function sceneDuration(scene: Scene): number {
  const begins = shotBegins(scene);
  return begins.length ? begins[begins.length - 1] + SHOT_SECONDS + 1.4 : 0;
}

export function DrillScene({ scene, className }: { scene: Scene; className?: string }) {
  const [run, setRun] = useState(0);
  // No ball flight to show: Dimples takes center stage.
  const isBody = scene.set === "body" || (scene.shots ?? []).length === 0;
  // With props on the floor (a wall, a stick, a mirror), Dimples stands to
  // the side so they stay visible.
  const hasProps = (scene.items ?? []).length > 0;
  const begins = shotBegins(scene);
  const loop = sceneDuration(scene);

  // Shot scenes replay on their own so the balls keep flying in step with
  // the stroke.
  useEffect(() => {
    if (isBody || !loop) return;
    const id = window.setTimeout(() => setRun((r) => r + 1), loop * 1000);
    return () => window.clearTimeout(id);
  }, [run, isBody, loop]);

  const sinks = (shot: SceneShot) =>
    (scene.items ?? []).some((it) => (it.k === "cup" || it.k === "mug") && Math.abs(it.x - shot.to[0]) < 2 && Math.abs(it.y - shot.to[1]) < 2);

  return (
    <div className={`relative overflow-hidden rounded-2xl ring-1 ring-black/[0.06] ${className ?? ""}`}>
      <svg key={run} viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Drill setup">
        <Background set={scene.set} />
        {isBody && !hasProps && <ellipse cx={W / 2} cy={190} rx={92} ry={12} fill="#d9c9a0" opacity={0.6} />}
        {(scene.items ?? []).map((item, i) => (
          <Item key={i} item={item} />
        ))}
        {!isBody && (scene.shots ?? []).map((shot, i) => <Shot key={i} shot={shot} begin={begins[i]} sinks={sinks(shot)} />)}
      </svg>
      <div
        key={`d${run}`}
        className={`pointer-events-none absolute ${
          isBody ? (hasProps ? "right-[6%] bottom-1 h-[84%] w-[42%]" : "inset-x-0 bottom-1 mx-auto h-[88%] w-[46%]") : "right-1 bottom-0 h-[52%] w-[24%]"
        }`}
      >
        <Dimples pose={scene.pose} className="h-full w-full" />
      </div>
      <button
        type="button"
        onClick={() => setRun((r) => r + 1)}
        className="font-label absolute top-2 left-2 rounded-full bg-white/85 px-2.5 py-1 text-xs font-bold text-neutral-700 shadow-sm active:bg-white"
      >
        Replay
      </button>
    </div>
  );
}
