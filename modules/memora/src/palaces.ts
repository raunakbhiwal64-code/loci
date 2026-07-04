import type { ModuleStorageApi } from "@loci/module-sdk";

/**
 * Ready-made palaces, the default practice list, and the custom (photo)
 * palace store. Custom palaces are built in builder/PhotoPalace.tsx and are
 * saved per-profile via ctx.storage — photos are downscaled JPEG dataURLs
 * (re-encoded through a canvas, which strips EXIF/GPS) and never leave the
 * device.
 */

export interface PalaceSpot {
  id: string;
  label: string;
  emoji: string;
  /** Photo palaces only: pin position as a percentage of the photo (0–100). */
  x?: number;
  y?: number;
}

export interface Palace {
  id: string;
  name: string;
  emoji: string;
  /** Ordered loci (spots) the child walks through. */
  loci: PalaceSpot[];
  /** Photo palaces only: downscaled JPEG dataURL. */
  photo?: string;
}

export const PALACES: Palace[] = [
  {
    id: "house",
    name: "My House",
    emoji: "🏠",
    loci: [
      { id: "door", label: "the front door", emoji: "🚪" },
      { id: "sofa", label: "the sofa", emoji: "🛋️" },
      { id: "tv", label: "the TV", emoji: "📺" },
      { id: "table", label: "the kitchen table", emoji: "🍽️" },
      { id: "fridge", label: "the fridge", emoji: "🧊" },
      { id: "stairs", label: "the stairs", emoji: "🪜" },
      { id: "bed", label: "the bed", emoji: "🛏️" },
      { id: "window", label: "the bedroom window", emoji: "🪟" },
    ],
  },
  {
    id: "treehouse",
    name: "Treehouse",
    emoji: "🌳",    loci: [
      { id: "gate", label: "the rope ladder", emoji: "🪜" },
      { id: "door", label: "the round door", emoji: "🚪" },
      { id: "window", label: "the little window", emoji: "🪟" },
      { id: "chest", label: "the treasure chest", emoji: "🧰" },
      { id: "lamp", label: "the swinging lamp", emoji: "🏮" },
      { id: "slide", label: "the twisty slide", emoji: "🛝" },
      { id: "swing", label: "the tyre swing", emoji: "🛞" },
      { id: "flag", label: "the flag on top", emoji: "🚩" },
    ],
  },
  {
    id: "aquarium",
    name: "Aquarium",
    emoji: "🐠",
    loci: [
      { id: "tank", label: "the big glass tank", emoji: "🪟" },
      { id: "coral", label: "the coral castle", emoji: "🪸" },
      { id: "tunnel", label: "the glass tunnel", emoji: "🕳️" },
      { id: "jelly", label: "the jellyfish lamp", emoji: "🪼" },
      { id: "shark", label: "the shark's cave", emoji: "🦈" },
      { id: "star", label: "the starfish rock", emoji: "⭐" },
      { id: "shell", label: "the giant shell", emoji: "🐚" },
      { id: "gift", label: "the gift shop", emoji: "🎁" },
    ],
  },
];

/** Default list to memorise — the eight planets. */
export const DEFAULT_LIST = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];

/* ---------------- custom palace store (per-profile) ---------------- */

const CUSTOM_KEY = "custom-palaces";

export function loadCustomPalaces(storage: ModuleStorageApi): Palace[] {
  return storage.get<Palace[]>(CUSTOM_KEY) ?? [];
}

export function saveCustomPalace(storage: ModuleStorageApi, palace: Palace): void {
  const all = loadCustomPalaces(storage).filter((p) => p.id !== palace.id);
  storage.set(CUSTOM_KEY, [...all, palace]);
}

export function deleteCustomPalace(storage: ModuleStorageApi, id: string): void {
  storage.set(
    CUSTOM_KEY,
    loadCustomPalaces(storage).filter((p) => p.id !== id)
  );
}

/** Every palace the child can walk: ready-made first, then their own. */
export function allPalaces(storage: ModuleStorageApi): Palace[] {
  return [...PALACES, ...loadCustomPalaces(storage)];
}
