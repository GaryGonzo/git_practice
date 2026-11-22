import type { Pose } from "@golfable/shared";

// Dimples: Golfable's mascot. A golf ball in a Golfable-green cap with a
// gold band, white gloves and black shoes. Every pose is the same body with
// different arms, legs and club, animated with plain CSS so it stays light
// and identical everywhere (drill scenes, recap, share image).

const INK = "#14201b";
const CAP = "#1f4d36";
const GOLD = "#c6a64b";
const DIMPLE = "#e4e8e2";
const SHAFT = "#8a9190";

const STYLE = `
.dmp * { transform-box: view-box; }
.dmp-pendulum { transform-origin: 60px 76px; animation: dmp-pendulum 1.6s ease-in-out infinite alternate; }
@keyframes dmp-pendulum { from { transform: rotate(-13deg); } to { transform: rotate(13deg); } }
.dmp-chip { transform-origin: 60px 76px; animation: dmp-chip 1.8s ease-in-out infinite alternate; }
@keyframes dmp-chip { from { transform: rotate(-48deg); } to { transform: rotate(52deg); } }
.dmp-swing { transform-origin: 60px 76px; animation: dmp-swing 2.6s cubic-bezier(.45,0,.2,1) infinite; }
@keyframes dmp-swing {
  0% { transform: rotate(0deg); } 30% { transform: rotate(-118deg); } 42% { transform: rotate(-120deg); }
  62% { transform: rotate(10deg); } 78% { transform: rotate(128deg); } 100% { transform: rotate(128deg); }
}
.dmp-turn { transform-origin: 60px 64px; animation: dmp-turn 2.2s ease-in-out infinite alternate; }
@keyframes dmp-turn { from { transform: scaleX(1) translateX(-4px); } to { transform: scaleX(.84) translateX(7px); } }
.dmp-face-turn { animation: dmp-face 2.2s ease-in-out infinite alternate; }
@keyframes dmp-face { from { transform: translateX(-7px); } to { transform: translateX(8px); } }
.dmp-hips { transform-origin: 60px 110px; animation: dmp-hips 1.8s ease-in-out infinite alternate; }
@keyframes dmp-hips { from { transform: rotate(-6deg); } to { transform: rotate(6deg); } }
.dmp-hinge { transform-origin: 60px 128px; animation: dmp-hinge 2.6s ease-in-out infinite; }
@keyframes dmp-hinge { 0%,15% { transform: rotate(0deg); } 45%,75% { transform: rotate(17deg) translateY(4px); } 100% { transform: rotate(0deg); } }
.dmp-wobble { transform-origin: 54px 128px; animation: dmp-wobble 1.4s ease-in-out infinite alternate; }
@keyframes dmp-wobble { from { transform: rotate(-3deg); } to { transform: rotate(3deg); } }
.dmp-bob { animation: dmp-bob 2s ease-in-out infinite alternate; }
@keyframes dmp-bob { from { transform: translateY(0); } to { transform: translateY(-3px); } }
.dmp-jump { animation: dmp-jump .9s cubic-bezier(.3,0,.3,1) infinite alternate; }
@keyframes dmp-jump { from { transform: translateY(4px); } to { transform: translateY(-10px); } }
.dmp-think { animation: dmp-think 1.6s ease-in-out infinite; }
@keyframes dmp-think { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
.dmp-squeeze { transform-origin: 60px 100px; animation: dmp-squeeze 1.4s ease-in-out infinite; }
@keyframes dmp-squeeze { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@media (prefers-reduced-motion: reduce) { .dmp * { animation: none !important; } }
`;

function Hand({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={5.2} fill="#fff" stroke={INK} strokeWidth={2.4} />;
}

function Arm({ from, to, via }: { from: [number, number]; to: [number, number]; via?: [number, number] }) {
  const d = via ? `M${from[0]} ${from[1]} Q${via[0]} ${via[1]} ${to[0]} ${to[1]}` : `M${from[0]} ${from[1]} L${to[0]} ${to[1]}`;
  return <path d={d} fill="none" stroke={INK} strokeWidth={4.6} strokeLinecap="round" />;
}

/** Club hanging from the hands at (60,104): putter blade or iron head. */
function Club({ kind }: { kind: "putter" | "iron" }) {
  return (
    <g>
      <line x1={60} y1={104} x2={60} y2={126} stroke={SHAFT} strokeWidth={2.6} strokeLinecap="round" />
      <rect x={57.6} y={100} width={4.8} height={10} rx={2} fill={INK} />
      {kind === "putter" ? (
        <rect x={51} y={124} width={18} height={6} rx={2} fill={INK} />
      ) : (
        <path d="M58 123 L71 126 L70 132 L57 129 Z" fill="#5f6766" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
      )}
    </g>
  );
}

function Legs({ pose }: { pose: Pose }) {
  if (pose === "balance") {
    return (
      <g>
        <path d="M54 95 L52 124" stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
        <path d="M66 95 L79 109 L70 116" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <ellipse cx={49} cy={127} rx={9.5} ry={4.6} fill={INK} />
        <ellipse cx={72} cy={118} rx={7.5} ry={4} fill={INK} transform="rotate(-20 72 118)" />
      </g>
    );
  }
  if (pose === "finish") {
    return (
      <g>
        <path d="M54 95 L49 124" stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
        <path d="M67 95 L74 112 L71 123" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <ellipse cx={46} cy={127} rx={9.5} ry={4.6} fill={INK} />
        <ellipse cx={72} cy={125} rx={4.6} ry={6.5} fill={INK} transform="rotate(25 72 125)" />
      </g>
    );
  }
  return (
    <g>
      <path d="M53 95 L50 124" stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M67 95 L70 124" stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
      <ellipse cx={46} cy={127} rx={9.5} ry={4.6} fill={INK} />
      <ellipse cx={74} cy={127} rx={9.5} ry={4.6} fill={INK} />
      <path d="M41 125.5 h7 M69 125.5 h7" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

function BallBody() {
  const dots: [number, number][] = [
    [38, 50], [46, 44], [74, 44], [82, 50], [32, 62], [88, 62], [34, 76], [86, 76],
    [42, 86], [78, 86], [52, 91], [68, 91], [60, 92], [40, 66], [80, 66],
  ];
  return (
    <g>
      <circle cx={60} cy={64} r={33} fill="#fff" stroke={INK} strokeWidth={3} />
      {dots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={2.6} fill={DIMPLE} />
      ))}
      <path d="M36 82 Q60 102 84 82" fill="none" stroke={DIMPLE} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
    </g>
  );
}

function Face({ happy }: { happy?: boolean }) {
  return (
    <g>
      {happy ? (
        <>
          <path d="M45 62 Q50 56 55 62" fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
          <path d="M65 62 Q70 56 75 62" fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx={50} cy={61} rx={5.6} ry={6.8} fill="#fff" stroke={INK} strokeWidth={2.2} />
          <ellipse cx={70} cy={61} rx={5.6} ry={6.8} fill="#fff" stroke={INK} strokeWidth={2.2} />
          <circle cx={51.2} cy={62.4} r={3.2} fill={INK} />
          <circle cx={71.2} cy={62.4} r={3.2} fill={INK} />
          <circle cx={52.3} cy={61} r={1.1} fill="#fff" />
          <circle cx={72.3} cy={61} r={1.1} fill="#fff" />
        </>
      )}
      <ellipse cx={42} cy={72} rx={4.2} ry={2.4} fill="#f4b9a4" opacity={0.8} />
      <ellipse cx={78} cy={72} rx={4.2} ry={2.4} fill="#f4b9a4" opacity={0.8} />
      {happy ? (
        <path d="M51 73 Q60 84 69 73 Z" fill={INK} />
      ) : (
        <path d="M53 74 Q60 80 67 74" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      )}
    </g>
  );
}

function Cap() {
  return (
    <g>
      <path d="M29 52 C29 22 91 22 91 52 Z" fill={CAP} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M29.5 49 H90.5 V53 H29.5 Z" fill={GOLD} />
      <path d="M86 50 C98 49 110 51 112 56 C104 58 94 57 86 55 Z" fill={CAP} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <circle cx={60} cy={27.5} r={2.8} fill={GOLD} />
      <path d="M60 30 V48" stroke="#2c6347" strokeWidth={1.4} />
    </g>
  );
}

const SHOULDER_L: [number, number] = [36, 76];
const SHOULDER_R: [number, number] = [84, 76];

function Arms({ pose }: { pose: Pose }) {
  switch (pose) {
    case "putt":
    case "chip":
    case "swing":
    case "grip":
    case "arms": {
      const cls = { putt: "dmp-pendulum", chip: "dmp-chip", swing: "dmp-swing", grip: "dmp-squeeze", arms: "dmp-pendulum" }[pose];
      return (
        <g className={cls}>
          <Arm from={[32, 74]} to={[57, 102]} via={[38, 98]} />
          <Arm from={[88, 74]} to={[63, 102]} via={[82, 98]} />
          {pose !== "arms" && <Club kind={pose === "putt" ? "putter" : "iron"} />}
          <Hand x={57.5} y={102} />
          <Hand x={62.5} y={103} />
        </g>
      );
    }
    case "turn":
      return (
        <g>
          <Arm from={[31, 72]} to={[74, 87]} via={[46, 96]} />
          <Arm from={[89, 72]} to={[46, 87]} via={[74, 96]} />
          <Hand x={74} y={87} />
          <Hand x={46} y={87} />
        </g>
      );
    case "hips":
      return (
        <g>
          <Arm from={SHOULDER_L} to={[33, 94]} via={[18, 86]} />
          <Arm from={SHOULDER_R} to={[87, 94]} via={[102, 86]} />
          <Hand x={34} y={94} />
          <Hand x={86} y={94} />
        </g>
      );
    case "hinge":
      return (
        <g>
          <Arm from={SHOULDER_L} to={[48, 104]} via={[40, 92]} />
          <Arm from={SHOULDER_R} to={[72, 104]} via={[80, 92]} />
          <Hand x={48} y={104} />
          <Hand x={72} y={104} />
        </g>
      );
    case "balance":
      return (
        <g>
          <Arm from={SHOULDER_L} to={[10, 70]} via={[22, 70]} />
          <Arm from={SHOULDER_R} to={[110, 70]} via={[98, 70]} />
          <Hand x={10} y={70} />
          <Hand x={110} y={70} />
        </g>
      );
    case "think":
      return (
        <g>
          <Arm from={SHOULDER_L} to={[30, 104]} via={[26, 92]} />
          <Arm from={SHOULDER_R} to={[66, 86]} via={[94, 96]} />
          <Hand x={30} y={104} />
          <Hand x={66} y={86} />
          <g className="dmp-think">
            <circle cx={98} cy={34} r={3} fill="#fff" stroke={INK} strokeWidth={1.6} />
            <circle cx={106} cy={24} r={4.5} fill="#fff" stroke={INK} strokeWidth={1.6} />
            <ellipse cx={104} cy={10} rx={14} ry={9} fill="#fff" stroke={INK} strokeWidth={1.8} />
            <path d="M97 10 h1 M104 10 h1 M111 10 h1" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
          </g>
        </g>
      );
    case "finish":
      // Hands high over the lead shoulder, club wrapped behind the head.
      return (
        <g>
          <line x1={28} y1={42} x2={98} y2={14} stroke={SHAFT} strokeWidth={2.6} strokeLinecap="round" />
          <path d="M96 9 L106 12 L103 19 L95 17 Z" fill="#5f6766" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
          <Arm from={SHOULDER_L} to={[26, 44]} via={[30, 60]} />
          <Arm from={SHOULDER_R} to={[30, 40]} via={[60, 40]} />
          <Hand x={26} y={44} />
          <Hand x={30} y={39} />
        </g>
      );
    case "celebrate":
      return (
        <g>
          <Arm from={SHOULDER_L} to={[20, 30]} via={[22, 56]} />
          <Arm from={SHOULDER_R} to={[100, 30]} via={[98, 56]} />
          <Hand x={20} y={30} />
          <Hand x={100} y={30} />
        </g>
      );
  }
}

export function Dimples({ pose = "putt", className, title = "Dimples, the Golfable mascot" }: { pose?: Pose; className?: string; title?: string }) {
  const happy = pose === "celebrate" || pose === "finish";
  const outer = pose === "hinge" ? "dmp-hinge" : pose === "balance" ? "dmp-wobble" : pose === "celebrate" ? "dmp-jump" : pose === "hips" ? "" : "dmp-bob";
  // Arms that wrap in front of the body draw on top of it; arms that reach
  // out or overhead draw behind so the ball's outline stays clean.
  const armsInFront = pose !== "swing" && pose !== "finish" && pose !== "hips" && pose !== "balance" && pose !== "celebrate" && pose !== "hinge";
  return (
    <svg viewBox="0 0 120 150" className={`dmp ${className ?? ""}`} role="img" aria-label={title}>
      <style>{STYLE}</style>
      <g className={outer}>
        <ellipse cx={60} cy={132} rx={34} ry={4} fill="#000" opacity={0.08} />
        <g className={pose === "hips" ? "dmp-hips" : ""}>
          <Legs pose={pose} />
        </g>
        {!armsInFront && <Arms pose={pose} />}
        <g className={pose === "turn" ? "dmp-turn" : ""}>
          <BallBody />
          <g className={pose === "turn" ? "dmp-face-turn" : ""}>
            <Face happy={happy} />
          </g>
          <Cap />
        </g>
        {armsInFront && <Arms pose={pose} />}
      </g>
    </svg>
  );
}
