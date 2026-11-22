// Compact form of the drill library seed: the library as one JSON literal,
// with v1 columns derived in SQL. Same result as build-drill-seed.ts.
import { DRILL_LIBRARY } from "../../packages/shared/src/index.ts";
const rows = DRILL_LIBRARY.map((d, i) => ({
  id: d.id, name: d.name, category: d.category, eq: d.equipment, steps: d.steps,
  sl: d.score?.label ?? null, max: d.score?.max ?? 1, dir: d.score?.lower ? "lower" : "higher",
  areas: d.areas, spots: d.spots, needs: d.needs, aids: d.aids ?? [], min: d.minutes,
  reps: d.reps ?? null, bt: d.score?.targets ?? null, scene: d.scene, kind: d.kind, level: d.level ?? "all", o: i,
}));
const json = JSON.stringify(rows).replace(/\$/g, "");
console.log(`insert into drills (id, name, category, setup_description, setup_equipment, rules_description, rules_scoring, target_scratch, target_low, target_mid, target_high, max_score, score_direction, status, areas, spots, needs, aids, minutes, scored, reps_label, steps, score_label, band_targets, scene, kind, level, sort_order)
select id, name, category::skill_category, steps[1], eq, array_to_string(steps[2:], ' '), array[coalesce(sl, reps, 'Done')],
  coalesce(bt->>'0-5','Done'), coalesce(bt->>'6-10','Done'), coalesce(bt->>'11-15','Done'), coalesce(bt->>'21+','Done'),
  max, dir, 'active', areas, spots, needs, aids, min, sl is not null, reps, steps, sl, bt, scene, kind, level, o
from jsonb_to_recordset($j$${json}$j$::jsonb) as x(id text, name text, category text, eq text[], steps text[], sl text, max smallint, dir text, areas text[], spots text[], needs text, aids text[], min smallint, reps text, bt jsonb, scene jsonb, kind text, level text, o smallint)
on conflict (id) do update set name = excluded.name, category = excluded.category, setup_description = excluded.setup_description, setup_equipment = excluded.setup_equipment, rules_description = excluded.rules_description, rules_scoring = excluded.rules_scoring, target_scratch = excluded.target_scratch, target_low = excluded.target_low, target_mid = excluded.target_mid, target_high = excluded.target_high, max_score = excluded.max_score, score_direction = excluded.score_direction, status = excluded.status, areas = excluded.areas, spots = excluded.spots, needs = excluded.needs, aids = excluded.aids, minutes = excluded.minutes, scored = excluded.scored, reps_label = excluded.reps_label, steps = excluded.steps, score_label = excluded.score_label, band_targets = excluded.band_targets, scene = excluded.scene, kind = excluded.kind, level = excluded.level, sort_order = excluded.sort_order;
update drills set status = 'archived' where id not in (${DRILL_LIBRARY.map((d) => `'${d.id}'`).join(",")});`);
