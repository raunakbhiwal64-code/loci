import React from "react";
import "./components.css";
import { getCompanion } from "./companion.js";

type Div = React.HTMLAttributes<HTMLDivElement>;

export function Button({
  variant = "solid",
  big,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost"; big?: boolean }) {
  const cls = ["ds-btn", variant === "ghost" ? "ds-btn--ghost" : "", big ? "ds-btn--big" : "", className]
    .filter(Boolean)
    .join(" ");
  return <button className={cls} {...rest} />;
}

export function Card({ className = "", ...rest }: Div) {
  return <div className={`ds-card ${className}`} {...rest} />;
}

export function Display({
  as: As = "h1",
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: "h1" | "h2" | "h3" }) {
  return <As className={`ds-display ${className}`} {...rest} />;
}

/** Progress ribbon — progress always visible, loss never dramatised (PRD 6.3). */
export function ProgressRibbon({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="ds-ribbon" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

/** The Guide — the child's chosen, named companion (PRD 6.5/7). */
export function GuideBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="ds-guide">
      <div className="ds-guide__face" aria-hidden>
        {getCompanion().emoji}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function Modal({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="ds-modal__scrim" onClick={onClose} role="dialog" aria-modal>
      <Card className="ds-modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </Card>
    </div>
  );
}

export function Avatar({ emoji, label }: { emoji: string; label?: string }) {
  return (
    <div className="ds-avatar" role="img" aria-label={label ?? "avatar"}>
      {emoji}
    </div>
  );
}

export interface SkillRow {
  id: string;
  label: string;
  level: number;
  progressToNext: number; // 0..100
}

export function SkillMap({ skills }: { skills: SkillRow[] }) {
  return (
    <div className="ds-skillmap">
      {skills.map((s) => (
        <div className="ds-skill" key={s.id}>
          <div className="ds-skill__name">{s.label}</div>
          <div className="ds-skill__lvl">Level {s.level}</div>
          <ProgressRibbon value={s.progressToNext} />
        </div>
      ))}
    </div>
  );
}

export function DailyChallengeCard({
  title,
  subtitle,
  cta,
  onStart,
  done,
}: {
  title: string;
  subtitle: string;
  cta: string;
  onStart: () => void;
  done?: boolean;
}) {
  return (
    <div className="ds-daily">
      <Display as="h2">{title}</Display>
      <p style={{ marginTop: 8, marginBottom: 18, opacity: 0.95 }}>{subtitle}</p>
      <Button variant="ghost" big onClick={onStart} style={{ background: "#fff", color: "var(--ember-deep)", border: "none" }}>
        {done ? "See today's result" : cta}
      </Button>
    </div>
  );
}
