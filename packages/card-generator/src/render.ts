import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import type { Drill } from "@golfable/shared";
import { CARD_DIMENSIONS } from "@golfable/shared";
import { renderSetupCard, renderRulesCard, renderTargetsCard, wrapDocument } from "./templates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRILLS_DIR = path.join(ROOT, "drills");
const OUTPUT_DIR = path.join(ROOT, "output");
const FONTS_CSS_PATH = path.join(ROOT, "assets", "fonts", "fonts.css");
const CARDS_CSS_PATH = path.join(ROOT, "assets", "styles", "cards.css");
const FONTS_DIR = path.join(ROOT, "assets", "fonts");

const CARD_RENDERERS: Record<string, (drill: Drill) => string> = {
  "1-setup": renderSetupCard,
  "2-rules-scoring": renderRulesCard,
  "3-targets": renderTargetsCard,
};

async function loadDrills(): Promise<Drill[]> {
  const files = await readdir(DRILLS_DIR);
  const drills: Drill[] = [];
  for (const file of files) {
    if (!file.endsWith(".json") || file.startsWith("_")) continue;
    const raw = await readFile(path.join(DRILLS_DIR, file), "utf-8");
    drills.push(JSON.parse(raw) as Drill);
  }
  return drills;
}

async function loadFontsCssWithAbsolutePaths(): Promise<string> {
  const raw = await readFile(FONTS_CSS_PATH, "utf-8");
  return raw.replace(/url\('\.\/(.+?)'\)/g, (_match, filename: string) => {
    const absolutePath = path.join(FONTS_DIR, filename);
    return `url('${pathToFileURL(absolutePath).href}')`;
  });
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const [drills, fontsCss, cardsCss] = await Promise.all([
    loadDrills(),
    loadFontsCssWithAbsolutePaths(),
    readFile(CARDS_CSS_PATH, "utf-8"),
  ]);

  if (drills.length === 0) {
    console.log("No drill data files found in drills/. Add a drill JSON file and re-run.");
    return;
  }

  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({
    viewport: { width: CARD_DIMENSIONS.width, height: CARD_DIMENSIONS.height },
    deviceScaleFactor: 3,
  });

  for (const drill of drills) {
    const drillOutputDir = path.join(OUTPUT_DIR, drill.id);
    await mkdir(drillOutputDir, { recursive: true });

    for (const [cardKey, renderer] of Object.entries(CARD_RENDERERS)) {
      const html = wrapDocument(renderer(drill), fontsCss, cardsCss);
      const htmlPath = path.join(drillOutputDir, `${cardKey}.html`);
      await writeFile(htmlPath, html, "utf-8");

      await page.goto(pathToFileURL(htmlPath).href);
      await page.waitForTimeout(50);
      const card = page.locator(".card");
      const pngPath = path.join(drillOutputDir, `${cardKey}.png`);
      await card.screenshot({ path: pngPath });
      console.log(`Rendered ${path.relative(ROOT, pngPath)}`);
    }
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
