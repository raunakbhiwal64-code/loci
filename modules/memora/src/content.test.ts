import { describe, expect, it } from "vitest";
import type { ModuleStorageApi } from "@loci/module-sdk";
import { fitWithin, MAX_EDGE } from "./builder/downscale.js";
import {
  allPalaces,
  deleteCustomPalace,
  loadCustomPalaces,
  PALACES,
  saveCustomPalace,
  type Palace,
} from "./palaces.js";

/** Minimal in-memory ModuleStorageApi for round-trip tests. */
function memStorage(): ModuleStorageApi {
  const map = new Map<string, unknown>();
  return {
    get: <T = unknown>(k: string) => map.get(k) as T | undefined,
    set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
    keys: () => [...map.keys()],
  };
}

describe("fitWithin — downscale clamp math", () => {
  it("never upscales an image already within the cap", () => {
    expect(fitWithin(800, 600, MAX_EDGE)).toEqual({ width: 800, height: 600 });
  });

  it("clamps the long edge to the cap and preserves aspect ratio", () => {
    const r = fitWithin(4000, 3000, 1000);
    expect(Math.max(r.width, r.height)).toBe(1000);
    // 4000x3000 (4:3) → 1000x750
    expect(r).toEqual({ width: 1000, height: 750 });
  });

  it("clamps a portrait image on its long (height) edge", () => {
    const r = fitWithin(3000, 4000, 1000);
    expect(Math.max(r.width, r.height)).toBe(1000);
    expect(r).toEqual({ width: 750, height: 1000 });
  });

  it("returns zero size for non-positive dimensions", () => {
    expect(fitWithin(0, 0)).toEqual({ width: 0, height: 0 });
  });

  it("never rounds a dimension below 1px", () => {
    const r = fitWithin(2000, 1, 1000);
    expect(r.height).toBeGreaterThanOrEqual(1);
  });
});

describe("custom palace store round-trip", () => {
  const photoPalace: Palace = {
    id: "custom-test",
    name: "My bedroom",
    emoji: "🏠",
    photo: "data:image/jpeg;base64,AAAA",
    loci: [
      { id: "s1", label: "Spot 1", emoji: "📍", x: 10, y: 20 },
      { id: "s2", label: "Spot 2", emoji: "📍", x: 50, y: 50 },
      { id: "s3", label: "Spot 3", emoji: "📍", x: 80, y: 70 },
    ],
  };

  it("saves and loads a photo palace unchanged", () => {
    const storage = memStorage();
    saveCustomPalace(storage, photoPalace);
    expect(loadCustomPalaces(storage)).toEqual([photoPalace]);
  });

  it("makes custom palaces pickable via allPalaces (ready-made first)", () => {
    const storage = memStorage();
    saveCustomPalace(storage, photoPalace);
    const all = allPalaces(storage);
    expect(all.slice(0, PALACES.length)).toEqual(PALACES);
    expect(all.map((p) => p.id)).toContain("custom-test");
  });

  it("upserts by id rather than duplicating", () => {
    const storage = memStorage();
    saveCustomPalace(storage, photoPalace);
    saveCustomPalace(storage, { ...photoPalace, name: "Renamed" });
    const custom = loadCustomPalaces(storage);
    expect(custom).toHaveLength(1);
    expect(custom[0].name).toBe("Renamed");
  });

  it("deletes a custom palace", () => {
    const storage = memStorage();
    saveCustomPalace(storage, photoPalace);
    deleteCustomPalace(storage, "custom-test");
    expect(loadCustomPalaces(storage)).toEqual([]);
    expect(allPalaces(storage)).toEqual(PALACES);
  });
});
