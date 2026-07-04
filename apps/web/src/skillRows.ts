import { SKILLS, xpForLevel } from "@loci/core-progression";
import type { SkillRow } from "@loci/design-system";
import type { Spine } from "./spine.js";

/** Turn the current child's skill progress into rows for the SkillMap component. */
export function skillRows(spine: Spine): SkillRow[] {
  return spine
    .progression()
    .all()
    .map((p) => {
      const base = xpForLevel(p.level);
      const next = xpForLevel(p.level + 1);
      const progressToNext = next > base ? ((p.xp - base) / (next - base)) * 100 : 0;
      return { id: p.skillId, label: SKILLS[p.skillId].label, level: p.level, progressToNext };
    })
    .sort((a, b) => b.level - a.level || b.progressToNext - a.progressToNext);
}
