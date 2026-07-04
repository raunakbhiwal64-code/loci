/**
 * The companion (PRD 6.5) — the child picks one at first run and names it. One
 * friend across every module. The chosen face is a shared singleton so every
 * GuideBubble (in the shell and inside each module's own React root) shows the
 * same buddy. Set on boot and on profile switch from the spine.
 */

export interface CompanionDef {
  id: string;
  species: string;
  defaultName: string;
  emoji: string;
}

export const COMPANIONS: CompanionDef[] = [
  { id: "owl", species: "owl", defaultName: "Ollie", emoji: "🦉" },
  { id: "robot", species: "robot", defaultName: "Sprocket", emoji: "🤖" },
  { id: "dragon", species: "dragon", defaultName: "Pip", emoji: "🐉" },
  { id: "sprite", species: "star-sprite", defaultName: "Nova", emoji: "✨" },
  { id: "elephant", species: "elephant", defaultName: "Appu", emoji: "🐘" },
];

export const DEFAULT_COMPANION_ID = "owl";

export function companionById(id: string | undefined): CompanionDef {
  return COMPANIONS.find((c) => c.id === id) ?? COMPANIONS[0];
}

interface CurrentCompanion {
  emoji: string;
  name: string;
}

let current: CurrentCompanion = { emoji: COMPANIONS[0].emoji, name: COMPANIONS[0].defaultName };

/** Read the active companion (used by GuideBubble). */
export function getCompanion(): CurrentCompanion {
  return current;
}

/** Set the active companion from a chosen id + name (falls back to defaults). */
export function setCompanion(id: string | undefined, name?: string): void {
  const def = companionById(id);
  current = { emoji: def.emoji, name: (name && name.trim()) || def.defaultName };
}
