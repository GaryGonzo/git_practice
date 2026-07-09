import { useEffect } from "react";

declare global {
  interface Window {
    tiktokEmbed?: { lib?: { render?: (el?: Document | Element) => void } };
  }
}

const EMBED_SCRIPT_SRC = "https://www.tiktok.com/embed.js";

interface TikTokEmbedProps {
  url: string;
}

// Renders a real, playable TikTok post using TikTok's official oEmbed
// blockquote widget -- no API key or backend needed, just the public post
// URL. embed.js scans the page for `.tiktok-embed` blockquotes on load and
// hydrates them; if it's already loaded (multiple embeds on one page), we
// just ask it to re-scan instead of injecting the script twice.
export function TikTokEmbed({ url }: TikTokEmbedProps) {
  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${EMBED_SCRIPT_SRC}"]`);
    if (existing) {
      window.tiktokEmbed?.lib?.render?.();
      return;
    }
    const script = document.createElement("script");
    script.src = EMBED_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const videoId = url.match(/\/(?:video|photo)\/(\d+)/)?.[1];

  return (
    <blockquote
      className="tiktok-embed"
      cite={url}
      data-video-id={videoId}
      style={{ maxWidth: "325px", minWidth: "260px", margin: 0 }}
    >
      {/* Real fallback link to this exact post -- shown until (or unless)
          embed.js hydrates the blockquote into a player. Without it, a slow
          or failed hydration leaves an empty box with no way to reach the
          right video. */}
      <section>
        <a target="_blank" rel="noopener noreferrer" href={url}>
          View this Golfable on TikTok
        </a>
      </section>
    </blockquote>
  );
}
