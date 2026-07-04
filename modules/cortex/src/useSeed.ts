import { useCallback, useState } from "react";

/**
 * A changing 32-bit seed for deterministic puzzle generation. Returns the
 * current seed and a `next()` that jumps to a fresh one — used as a React key
 * so each new puzzle remounts its round with clean state.
 */
export function useSeed(salt = 0): [number, () => void] {
  const [seed, setSeed] = useState<number>(() => ((Date.now() ^ (salt * 2654435761)) >>> 0) || 1);
  const next = useCallback(() => {
    setSeed((s) => ((Math.imul(s, 1103515245) + 12345) ^ Date.now()) >>> 0 || 1);
  }, []);
  return [seed, next];
}
