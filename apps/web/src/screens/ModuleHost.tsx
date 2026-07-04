import { useEffect, useRef, useState } from "react";
import { Button, Display } from "@loci/design-system";
import { applyAccent } from "@loci/design-system";
import type { Spine } from "../spine.js";
import { findModule } from "../registry.js";

/**
 * Screens 5 & 6 — Module home / activity player chrome. Lazy-loads the module
 * chunk on entry (perf budget), builds its ModuleContext from the spine, and
 * mounts it into a plain container element via the module contract.
 */
export function ModuleHost({ spine, moduleId, onBack }: { spine: Spine; moduleId: string; onBack: () => void }) {
  const entry = findModule(moduleId);
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const host = hostRef.current;
    if (!entry || !host) {
      if (!entry) setStatus("error");
      return;
    }
    // Give the module its own detached child so nested roots never fight over
    // the same container across StrictMode's mount/unmount/mount cycle.
    const el = document.createElement("div");
    host.appendChild(el);
    let cleanup: void | (() => void);
    let cancelled = false;

    const loaded = entry
      .load()
      .then((mod) => {
        if (cancelled) return;
        applyAccent(host, mod.accentToken);
        spine.analytics.emit({ kind: "session", action: "module_opened", moduleId: mod.id });
        cleanup = mod.mount(el, spine.contextFor(mod));
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      // Wait for the (possibly still-pending) load, then tear down as a
      // microtask — never unmounting a nested root during the parent's render.
      void loaded.then(() => {
        if (typeof cleanup === "function") cleanup();
        el.remove();
      });
    };
  }, [entry, spine]);

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onBack}>← Home</Button>
        <Display as="h2" style={{ fontSize: "1.4rem" }}>{entry?.displayName ?? "Module"}</Display>
      </div>
      {status === "loading" && <p className="ds-muted">Loading {entry?.displayName}…</p>}
      {status === "error" && <p className="ds-muted">This module couldn't load. The rest of Loci still works.</p>}
      <div ref={hostRef} className="module-slot" />
    </div>
  );
}
