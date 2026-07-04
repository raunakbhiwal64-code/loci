/**
 * Ready-made palaces and the default practice list. A focused port of the
 * existing Memora content onto the spine (the full app has more palaces and a
 * photo-builder; those carry over in a later pass — see modules/memora/README).
 */

export interface Palace {
  id: string;
  name: string;
  emoji: string;
  /** Ordered loci (spots) the child walks through. */
  loci: { id: string; label: string; emoji: string }[];
}

export const PALACES: Palace[] = [
  {
    id: "treehouse",
    name: "Treehouse",
    emoji: "🌳",
    loci: [
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
