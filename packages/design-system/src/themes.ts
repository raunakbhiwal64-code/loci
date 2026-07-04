/**
 * Theme registry + apply/persist helpers. Themes re-skin the chrome palette
 * (see the `:root.theme-<id>` blocks in tokens.css). The kid picks one; it is
 * applied by toggling the class on <html> and remembered per profile.
 */

export interface ThemeDef {
  id: string;
  label: string;
  /** 1–2 swatch colours for the picker chip. */
  swatch: string[];
  dark: boolean;
  /** Optional flavour note for the picker. */
  note?: string;
}

export const THEMES: ThemeDef[] = [
  { id: "storybook", label: "Soft Storybook", swatch: ["#8e7be6", "#9be3c4"], dark: false, note: "gentle default" },
  { id: "candy", label: "Candy Pop", swatch: ["#7a5af0", "#ff5fa2"], dark: false },
  { id: "jungle", label: "Jungle Quest", swatch: ["#0e9f8e", "#ffa930"], dark: false },
  { id: "meadow", label: "Meadow", swatch: ["#54b85e", "#f2c63d"], dark: false },
  { id: "bubblegum", label: "Bubblegum", swatch: ["#f5459a", "#ffb84d"], dark: false },
  { id: "ocean", label: "Ocean", swatch: ["#17a9a0", "#7fd6d0"], dark: false },
  { id: "cosmic", label: "Cosmic Explorer", swatch: ["#1e1b3a", "#ff61c6"], dark: true, note: "space" },
  { id: "dusk", label: "Dusk", swatch: ["#2b2740", "#b7a6ff"], dark: true, note: "evening" },
  { id: "starlight", label: "Starlight", swatch: ["#141a38", "#5fd3d3"], dark: true, note: "night sky" },
];

export const DEFAULT_THEME = "storybook";

const THEME_IDS = new Set(THEMES.map((t) => t.id));

export function isThemeId(id: string): boolean {
  return THEME_IDS.has(id);
}

/** Apply a theme by toggling `theme-<id>` on the document root. */
export function applyTheme(themeId: string): void {
  if (typeof document === "undefined") return;
  const id = isThemeId(themeId) ? themeId : DEFAULT_THEME;
  const root = document.documentElement;
  root.classList.forEach((c) => {
    if (c.startsWith("theme-")) root.classList.remove(c);
  });
  root.classList.add(`theme-${id}`);
}
