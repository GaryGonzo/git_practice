import { useEffect, useState } from "react";
import type { Drill, HandicapBand } from "@golfable/shared";
import { Dimples, DimplesFrame } from "../Dimples";
import { targetFor, type PracticePlan } from "../../lib/sessionBuilder";
import { beatsChallenge, type Badge, type Challenge } from "../../lib/golfableInsights";
import { BadgeMedal } from "./Insights";
import type { StepResult } from "./SessionViews";
import { planSummary } from "./SessionViews";

// Session recap: Dimples celebrating, what you did, how scores compared to
// your targets, any personal bests -- then "Share your progress", which
// builds an image on the phone and hands it to the share sheet (the way a
// web app gets an image into Instagram, TikTok or Facebook).

interface RecapRow {
  name: string;
  scored: boolean;
  score?: number;
  target?: string;
  hit?: boolean;
  pb?: boolean;
  skipped?: boolean;
}

function rowsFor(plan: PracticePlan, library: Map<string, Drill>, results: Record<number, StepResult>, band: HandicapBand): RecapRow[] {
  const rows: RecapRow[] = [];
  plan.steps.forEach((s, i) => {
    if (s.type !== "drill") return;
    const d = library.get(s.drillId);
    if (!d) return;
    const r = results[i];
    rows.push({
      name: d.name,
      scored: d.scored !== false,
      score: r?.score,
      target: targetFor(d, band)?.text,
      hit: r?.hitTarget,
      pb: r?.personalBest,
      skipped: r?.skipped || r?.score === undefined,
    });
  });
  return rows;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function buildShareImage(rows: RecapRow[], minutes: number, summary: string): Promise<Blob> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  // Dimples without his animation styles -- a still frame for the image.
  const mascot = renderToStaticMarkup(<DimplesFrame pose="celebrate" time={0.5} onDark />).replace("<svg ", '<svg x="720" y="60" width="300" height="380" ');

  const done = rows.filter((r) => !r.skipped);
  const scored = done.filter((r) => r.scored);
  const hits = scored.filter((r) => r.hit).length;
  const pbs = done.filter((r) => r.pb).length;
  const list = done.slice(0, 6);
  const display = "Bebas Neue, Impact, Arial Narrow, sans-serif";
  const body = "Barlow, Helvetica, Arial, sans-serif";

  const stat = (x: number, value: string, label: string) => `
    <text x="${x}" y="690" font-family="${display}" font-size="120" fill="#c6a64b">${esc(value)}</text>
    <text x="${x}" y="740" font-family="${body}" font-size="34" font-weight="600" fill="#ffffff" opacity="0.75">${esc(label)}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <rect width="1080" height="1350" fill="#14201b"/>
    <g opacity="0.05" fill="#ffffff">${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 120}" y="0" width="60" height="1350"/>`).join("")}</g>
    <text x="80" y="150" font-family="${body}" font-size="40" font-weight="700" fill="#c6a64b" letter-spacing="4">GOLFABLE</text>
    <text x="80" y="300" font-family="${display}" font-size="150" fill="#ffffff">SESSION</text>
    <text x="80" y="440" font-family="${display}" font-size="150" fill="#ffffff">DONE.</text>
    <text x="80" y="510" font-family="${body}" font-size="36" fill="#ffffff" opacity="0.7">${esc(summary)}</text>
    ${mascot}
    ${stat(80, String(done.length), "drills")}
    ${stat(400, String(minutes), "minutes")}
    ${stat(720, scored.length ? `${hits}/${scored.length}` : String(pbs), scored.length ? "targets hit" : "PBs")}
    <line x1="80" y1="810" x2="1000" y2="810" stroke="#ffffff" stroke-opacity="0.15" stroke-width="3"/>
    ${list
      .map(
        (r, i) => `
      <text x="80" y="${890 + i * 66}" font-family="${body}" font-size="40" font-weight="600" fill="#ffffff">${esc(r.name)}${r.pb ? "  ★ PB" : ""}</text>
      <text x="1000" y="${890 + i * 66}" text-anchor="end" font-family="${display}" font-size="52" fill="${r.hit ? "#c6a64b" : "#ffffff"}">${r.scored ? esc(String(r.score ?? "")) : "✓"}</text>`
      )
      .join("")}
    <text x="80" y="1290" font-family="${body}" font-size="36" font-weight="600" fill="#ffffff" opacity="0.6">A Golfable a day keeps the yips away · golfable.co</text>
  </svg>`;

  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Couldn't draw the share image"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No image"))), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ShareButton({ label, color, onClick, disabled }: { label: string; color: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="font-label flex-1 rounded-xl px-2 py-3 text-sm font-bold text-white disabled:opacity-50"
      style={{ backgroundColor: color }}
    >
      {label}
    </button>
  );
}

export function Recap({
  plan,
  library,
  results,
  band,
  newBadges = [],
  challenge = null,
  onDone,
}: {
  plan: PracticePlan;
  library: Map<string, Drill>;
  results: Record<number, StepResult>;
  band: HandicapBand;
  /** Badges this session just earned. */
  newBadges?: Badge[];
  /** Set when the session was a friend's challenge. */
  challenge?: Challenge | null;
  onDone: () => void;
}) {
  const rows = rowsFor(plan, library, results, band);
  const done = rows.filter((r) => !r.skipped);
  const scored = done.filter((r) => r.scored);
  const hits = scored.filter((r) => r.hit).length;
  const minutes = plan.steps.reduce((m, s, i) => m + (s.type === "drill" && results[i]?.score !== undefined ? s.minutes : 0), 0);
  const summary = planSummary(plan);

  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let url = "";
    buildShareImage(rows, minutes, summary)
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setImage({ blob, url });
      })
      .catch(() => setShareError("Couldn't make the share image on this device."));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fileFor(): File | null {
    return image ? new File([image.blob], "golfable-session.png", { type: "image/png" }) : null;
  }

  async function share(app: string) {
    const file = fileFor();
    if (!file) return;
    setShareError(null);
    if (navigator.canShare?.({ files: [file] })) {
      setHint(`Pick ${app} in the share menu.`);
      try {
        await navigator.share({ files: [file] });
      } catch {
        // Closing the share sheet isn't an error.
      }
      return;
    }
    download();
    setHint(`Image downloaded. Open ${app} and post it from your photos.`);
  }

  // On phones, "Save" opens the share menu with just the image, where
  // "Save Image" puts it straight in Photos. (A plain download on iPhone
  // goes to Files behind a confusing "Download?" prompt.) Desktop downloads.
  async function save() {
    const file = fileFor();
    if (!file) return;
    setShareError(null);
    if (navigator.canShare?.({ files: [file] })) {
      setHint("Tap \u201cSave Image\u201d to add it to your Photos.");
      try {
        await navigator.share({ files: [file] });
      } catch {
        // Closed the menu.
      }
      return;
    }
    download();
    setHint("Image downloaded.");
  }

  function download() {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image.url;
    a.download = "golfable-session.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const challengeDrill = challenge ? library.get(challenge.drillId) : undefined;
  const challengeScore = challenge ? plan.steps.map((s, i) => (s.type === "drill" && s.drillId === challenge.drillId ? results[i]?.score : undefined)).find((x) => x !== undefined) : undefined;
  const wonChallenge = challenge && challengeDrill && challengeScore !== undefined ? beatsChallenge(challengeDrill, challengeScore, challenge.score) : null;

  return (
    <div className="mx-auto max-w-md px-4 pb-28">
      {wonChallenge !== null && (
        <div className={`mt-5 rounded-2xl px-4 py-3 ${wonChallenge ? "bg-gold/25" : "bg-neutral-100"}`}>
          <p className="font-display text-[1.7rem] leading-none tracking-wide">
            {wonChallenge ? `You beat ${challenge!.from}!` : `${challenge!.from} wins this one.`}
          </p>
          <p className="font-body mt-1 text-sm text-neutral-600">
            {challengeDrill!.name}: you {challengeScore}, {challenge!.from} {challenge!.score}.
          </p>
        </div>
      )}

      {newBadges.length > 0 && (
        <section className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
          <div className="flex items-center gap-3">
            <Dimples pose="dance" className="-my-2 h-24 w-20 flex-none" />
            <div>
              <p className="font-label text-gold text-sm font-bold">{newBadges.length === 1 ? "New badge" : `${newBadges.length} new badges`}</p>
              <p className="font-display text-[1.8rem] leading-[0.95] tracking-wide">{newBadges.map((b) => b.name).join(" · ")}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {newBadges.map((b) => (
              <div key={b.id} className="flex items-center gap-2">
                <BadgeMedal badge={b} size={48} fresh />
                <p className="font-body max-w-[9rem] text-xs text-neutral-600">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="bg-brand-dark relative mt-5 overflow-hidden rounded-3xl px-5 pt-5 pb-6 text-white">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-label text-gold text-base font-semibold">Session complete</p>
            <h1 className="font-display text-[3rem] leading-[0.9] tracking-wide">Nice work.</h1>
            <p className="font-body mt-1 text-sm text-white/70">{summary}</p>
          </div>
          <Dimples pose="celebrate" onDark className="-mr-2 h-32 w-28 flex-none" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { v: String(done.length), l: "drills" },
            { v: String(minutes), l: "minutes" },
            { v: scored.length ? `${hits}/${scored.length}` : "—", l: "targets hit" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-white/[0.07] px-2 py-2 text-center">
              <p className="font-display text-gold text-3xl leading-none">{s.v}</p>
              <p className="font-label text-sm font-semibold text-white/70">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white px-4 ring-1 ring-black/[0.06]">
        {rows.map((r, i) => (
          <div key={i} className={`flex items-center justify-between gap-3 border-t border-neutral-100 py-3 first:border-t-0 ${r.skipped ? "opacity-50" : ""}`}>
            <div className="min-w-0">
              <p className="font-label truncate text-base leading-tight font-semibold">
                {r.name}
                {r.pb && <span className="bg-gold/20 text-brand-dark ml-2 rounded-full px-2 py-0.5 text-xs font-bold">PB</span>}
              </p>
              {r.scored && r.target && !r.skipped && <p className="font-body text-xs text-neutral-500">Target {r.target}</p>}
            </div>
            <p className={`font-display flex-none text-2xl ${r.hit ? "text-brand" : "text-neutral-700"}`}>
              {r.skipped ? "Skipped" : r.scored ? r.score : "✓"}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-6">
        <h2 className="font-label text-lg font-semibold text-neutral-800">Share your progress</h2>
        <div className="mt-2 overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-black/[0.06]">
          {image ? (
            <img src={image.url} alt="Your session summary image" className="mx-auto w-2/3 rounded-xl shadow-md" />
          ) : (
            <div className="mx-auto aspect-[4/5] w-2/3 animate-pulse rounded-xl bg-neutral-100" />
          )}
          <div className="mt-3 flex gap-2">
            <ShareButton label="Instagram" color="#c13584" disabled={!image} onClick={() => share("Instagram")} />
            <ShareButton label="TikTok" color="#111111" disabled={!image} onClick={() => share("TikTok")} />
            <ShareButton label="Facebook" color="#1877f2" disabled={!image} onClick={() => share("Facebook")} />
          </div>
          <button
            type="button"
            onClick={save}
            disabled={!image}
            className="font-label mt-2 w-full rounded-xl bg-neutral-100 px-4 py-3 text-sm font-bold text-neutral-800 active:bg-neutral-200 disabled:opacity-50"
          >
            Save to Photos
          </button>
          {hint && <p className="font-body text-center text-sm text-neutral-500">{hint}</p>}
          {shareError && <p className="font-body text-center text-sm text-red-600">{shareError}</p>}
        </div>
      </section>

      <button type="button" onClick={onDone} className="font-label bg-brand mt-6 w-full rounded-xl px-4 py-4 text-lg font-bold text-white">
        Done
      </button>
    </div>
  );
}
