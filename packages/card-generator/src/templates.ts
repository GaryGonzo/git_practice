import { CATEGORY_INFO, TIER_INFO, HANDICAP_TIERS, type Drill } from "@golfable/shared";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function header(drill: Drill, accent: string, badge: string, categoryLabel: string): string {
  return `
    <div class="card__accent"></div>
    <div class="card__header">
      <div class="card__badge">${badge}</div>
      <div class="card__heading">
        <div class="card__category">${escapeHtml(categoryLabel)}</div>
        <div class="card__title">${escapeHtml(drill.name)}</div>
      </div>
    </div>
  `;
}

function footer(pageLabel: string): string {
  return `
    <div class="card__footer">
      <div class="card__wordmark">Golfable</div>
      <div class="card__page">${escapeHtml(pageLabel)}</div>
    </div>
  `;
}

export function renderSetupCard(drill: Drill): string {
  const { color, badge, label } = CATEGORY_INFO[drill.category];
  const equipmentItems = drill.setup.equipment
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  return `
    <div class="card" style="--accent: ${color}">
      ${header(drill, color, badge, label)}
      <div class="card__section-label">Setup</div>
      <div class="card__body">
        <p class="card__description">${escapeHtml(drill.setup.description)}</p>
        <div>
          <div class="card__list-title">Equipment</div>
          <ul class="card__list">${equipmentItems}</ul>
        </div>
      </div>
      ${footer("1 / 3")}
    </div>
  `;
}

export function renderRulesCard(drill: Drill): string {
  const { color, badge, label } = CATEGORY_INFO[drill.category];
  const scoringItems = drill.rules.scoring
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  return `
    <div class="card" style="--accent: ${color}">
      ${header(drill, color, badge, label)}
      <div class="card__section-label">Rules &amp; Scoring</div>
      <div class="card__body">
        <p class="card__description">${escapeHtml(drill.rules.description)}</p>
        <div>
          <div class="card__list-title">Scoring</div>
          <ul class="card__list">${scoringItems}</ul>
        </div>
      </div>
      ${footer("2 / 3")}
    </div>
  `;
}

export function renderTargetsCard(drill: Drill): string {
  const { color, badge, label } = CATEGORY_INFO[drill.category];
  const rows = HANDICAP_TIERS.map((tier) => {
    const tierInfo = TIER_INFO[tier];
    const value = drill.targets[tier];
    return `
      <div class="card__target-row">
        <div class="card__target-tier">
          <div class="card__target-tier-label">${escapeHtml(tierInfo.label)}</div>
          <div class="card__target-tier-sub">${escapeHtml(tierInfo.sublabel)}</div>
        </div>
        <div class="card__target-value">${escapeHtml(value)}</div>
      </div>
    `;
  }).join("");

  return `
    <div class="card" style="--accent: ${color}">
      ${header(drill, color, badge, label)}
      <div class="card__section-label">Targets</div>
      <div class="card__body">
        <div class="card__targets">${rows}</div>
      </div>
      ${footer("3 / 3")}
    </div>
  `;
}

export function wrapDocument(bodyHtml: string, fontsCss: string, cardsCss: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>${fontsCss}</style>
    <style>${cardsCss}</style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`;
}
