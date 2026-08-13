import { Link } from "react-router-dom";

function MetronomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8 20h8l-2.2-14h-3.6L8 20Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10.5 9.5 15 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 20h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function FairwayFinderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 20 10 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 20 14 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 20h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function GreenReaderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="9" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function SwingTempoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 21a8.5 8.5 0 1 0-6-14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 3v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlignmentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M9 3v18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15 3v18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1 3.5" />
    </svg>
  );
}

function GappingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 20V10M11 20V6M17 20v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3 20h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PreShotTimerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 9v4l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 2h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

interface Tool {
  to: string;
  name: string;
  description: string;
  icon: (props: { className?: string }) => React.JSX.Element;
}

const TOOLS: Tool[] = [
  {
    to: "/app/tools/metronome",
    name: "Metronome",
    description: "Dial in a consistent swing tempo with adjustable BPM.",
    icon: MetronomeIcon,
  },
  {
    to: "/app/tools/fairway-finder",
    name: "Fairway Finder",
    description: "Point your camera downrange and see boundary lines for any fairway width.",
    icon: FairwayFinderIcon,
  },
  {
    to: "/app/tools/green-reader",
    name: "Green Reader",
    description: "Lay your phone flat on the green to read its slope.",
    icon: GreenReaderIcon,
  },
  {
    to: "/app/tools/swing-tempo",
    name: "Swing Tempo",
    description: "Measure your backswing-to-downswing ratio against the tour-average 3:1.",
    icon: SwingTempoIcon,
  },
  {
    to: "/app/tools/alignment-checker",
    name: "Alignment Checker",
    description: "Prop your camera down the target line and check your setup is square.",
    icon: AlignmentIcon,
  },
  {
    to: "/app/tools/gapping",
    name: "Club Gapping",
    description: "Log carry distances and see your average per club.",
    icon: GappingIcon,
  },
  {
    to: "/app/tools/pre-shot-timer",
    name: "Pre-Shot Timer",
    description: "Time your routine and keep it consistent shot to shot.",
    icon: PreShotTimerIcon,
  },
];

export function ToolsScreen() {
  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <h1 className="font-display text-2xl tracking-wide">Training Tools</h1>
      <p className="font-body mt-1 text-sm text-neutral-500">Extra practice aids to sharpen your game.</p>

      <div className="mt-4 space-y-2">
        {TOOLS.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 active:bg-neutral-50"
          >
            <div className="bg-brand/10 flex h-10 w-10 flex-none items-center justify-center rounded-full">
              <tool.icon className="text-brand h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-label text-sm font-semibold">{tool.name}</p>
              <p className="font-body text-xs text-neutral-500">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
