import { useEffect, useRef, useState } from "react";
import { Button, Display, getCompanion } from "@loci/design-system";
import type { Milestone } from "../milestones.js";

/**
 * Full-screen milestone celebration (PRD 6.6, screen 18). A genuine, earned
 * moment: confetti, the companion cheering, a certificate the parent can share.
 * Respects reduced-motion (no confetti) and always endorses stopping.
 */
export function Celebration({
  milestone,
  childName,
  onClose,
}: {
  milestone: Milestone;
  childName: string;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shared, setShared] = useState<string>();
  const buddy = getCompanion().emoji;
  const dateStr = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  useEffect(() => {
    const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    if (reduced || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();
    const colors = ["#FF7A45", "#FFC53D", "#8E7BE6", "#3FB7AE", "#E27BB0", "#6FC06F"];
    const parts = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: (4 + Math.random() * 6) * dpr,
      vy: (1.5 + Math.random() * 3) * dpr,
      vx: (Math.random() - 0.5) * 2 * dpr,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of parts) {
        p.y += p.vy;
        p.x += p.vx;
        p.rot += p.vr;
        if (p.y > canvas.height + 20) p.y = -20;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        ctx.restore();
      }
      if (t - start < 6000) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const share = async () => {
    const text = `${childName} earned "${milestone.title}" on Loci ${milestone.emoji}\n${milestone.blurb}`;
    const nav = navigator as Navigator & { share?: (d: { text: string; title?: string }) => Promise<void> };
    try {
      if (nav.share) {
        await nav.share({ title: "A Loci milestone!", text });
        setShared("Shared!");
      } else {
        await navigator.clipboard.writeText(text);
        setShared("Copied — paste it into a family chat!");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div
      role="dialog"
      aria-modal
      aria-label={`Milestone: ${milestone.title}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "radial-gradient(120% 120% at 50% 0%, color-mix(in srgb, var(--gold) 35%, var(--surface)), var(--parchment) 70%)",
      }}
    >
      <canvas ref={canvasRef} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          background: "var(--surface-raised)",
          border: "3px solid var(--gold)",
          borderRadius: "var(--r-lg)",
          padding: "28px 24px",
          textAlign: "center",
          boxShadow: "var(--shadow)",
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: 2, fontWeight: 800, color: "var(--ember-deep)", textTransform: "uppercase" }}>
          Certificate of achievement
        </div>
        <div style={{ fontSize: 64, lineHeight: 1, margin: "12px 0" }}>{milestone.emoji}</div>
        <Display as="h2" style={{ fontSize: "1.6rem" }}>{milestone.title}</Display>
        <p style={{ margin: "8px 0 4px", fontWeight: 700 }}>Awarded to {childName}</p>
        <p className="ds-muted" style={{ margin: "0 0 12px" }}>{milestone.blurb}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed var(--line)", paddingTop: 12, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
          <span>{buddy} Loci</span>
          <span>{dateStr}</span>
        </div>

        <div className="stack" style={{ marginTop: 18 }}>
          <Button big onClick={share}>📣 Share {childName}'s achievement</Button>
          {shared && <p className="ds-muted" style={{ margin: 0 }}>{shared}</p>}
          <Button variant="ghost" onClick={onClose}>Keep going</Button>
          <p className="ds-muted" style={{ margin: 0, fontSize: "0.8rem" }}>…or a perfect moment to go play outside 🌳</p>
        </div>
      </div>
    </div>
  );
}
