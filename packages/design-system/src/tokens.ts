import type { DesignSystem } from "@loci/module-sdk";

/** Per-module accent token names (map to CSS vars in tokens.css). */
export const MODULE_ACCENTS: Record<string, string> = {
  memora: "--accent-memora",
  gambit: "--accent-gambit",
  abacus: "--accent-abacus",
  cortex: "--accent-cortex",
  placeholder: "--accent-placeholder",
};

function readVar(name: string): string {
  if (typeof getComputedStyle === "undefined" || typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Build the DesignSystem handed to a module via ModuleContext. */
export function designSystemFor(accentToken: string): DesignSystem {
  return {
    accentVar: accentToken,
    token: (name) => readVar(name.startsWith("--") ? name : `--${name}`),
  };
}

/** Apply a module's accent to a container so `var(--accent)` themes it. */
export function applyAccent(el: HTMLElement, accentToken: string): void {
  const cssVar = accentToken.startsWith("--") ? accentToken : `--${accentToken}`;
  el.style.setProperty("--accent", `var(${cssVar})`);
}
