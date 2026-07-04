import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { Spine } from "../spine.js";
import { dateKey } from "@loci/data-local";
import { glyphGrid, shareResult } from "./shareCard.js";
import { isScenarioDay, scenarioOfWeek } from "../guardian/logic.js";
import { ScenarioPlayer } from "../guardian/ScenarioPlayer.js";
import { WisdomCardView } from "../guardian/WisdomCard.js";

/**
 * Screen 3 & 4 — Daily challenge flow + share card (PRD 6.3 / Section 2).
 * Phase-1 challenge is memory-based (feeds off Memora's skill). Finite and
 * satisfying, like a crossword — not endless.
 */

const ICONS = ["🍎", "🚀", "🐙", "🎸", "🌵", "🧩", "🦋", "🏰", "🍄", "⚓", "🎈", "🔑", "🌙", "🐝", "🐳", "🎩"];

type Phase = "intro" | "study" | "recall" | "result";

export function DailyChallenge({ spine, onBack }: { spine: Spine; onBack: () => void }) {
  const profile = spine.activeProfile()!;
  const key = dateKey();
  const total = 6;

  // Deterministic-per-day set so everyone gets the same challenge (shareable).
  const target = useMemo(() => {
    const seed = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
    const shuffled = [...ICONS].sort((a, b) => ((seed + a.charCodeAt(0)) % 7) - ((seed + b.charCodeAt(0)) % 7));
    return shuffled.slice(0, total);
  }, [key]);

  const [phase, setPhase] = useState<Phase>("intro");
  const [picked, setPicked] = useState<string[]>([]);
  const [correct, setCorrect] = useState(0);

  // Saturday: the Guardian scenario IS the daily challenge (PRD 6.4).
  const scenarioDay = isScenarioDay();
  const scenario = scenarioOfWeek();

  const finishScenario = (firstTrySafe: boolean) => {
    const streakAfter = spine.store.streak(profile.id, new Date()) + (spine.store.getDaily(profile.id, key)?.completed ? 0 : 1);
    spine.store.putDaily({
      profileId: profile.id,
      dateKey: key,
      challengeId: `guardian-${key}`,
      completed: true,
      scoreSummary: firstTrySafe ? "🛡️🟩" : "🛡️",
      shared: false,
      streakAfter,
    });
    spine.progression().award("metacognition", 25);
    spine.analytics.emit({ kind: "daily", action: "completed", challengeId: `guardian-${key}` });
    spine.notify();
    setCorrect(firstTrySafe ? total : total - 1);
    setPhase("result");
  };

  if (scenarioDay && phase !== "result") {
    return (
      <div className="stack">
        <div className="crumbs">
          <Button variant="ghost" onClick={onBack}>← Home</Button>
          <Display as="h2" style={{ fontSize: "1.4rem" }}>Today's Challenge</Display>
        </div>
        <GuideBubble>Saturday special — a safety drill! Show me the strong move.</GuideBubble>
        <ScenarioPlayer scenario={scenario} onDone={finishScenario} />
      </div>
    );
  }

  const finish = () => {
    const hit = picked.filter((p) => target.includes(p)).length;
    setCorrect(hit);
    const streakAfter = spine.store.streak(profile.id, new Date()) + (spine.store.getDaily(profile.id, key)?.completed ? 0 : 1);
    spine.store.putDaily({
      profileId: profile.id,
      dateKey: key,
      challengeId: `mem-${key}`,
      completed: true,
      scoreSummary: glyphGrid(hit, total),
      shared: false,
      streakAfter,
    });
    spine.progression().award("working-memory", 20 + hit * 5);
    spine.analytics.emit({ kind: "daily", action: "completed", challengeId: `mem-${key}` });
    spine.notify();
    setPhase("result");
  };

  const togglePick = (icon: string) => {
    setPicked((cur) => (cur.includes(icon) ? cur.filter((x) => x !== icon) : cur.length < total ? [...cur, icon] : cur));
  };

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onBack}>← Home</Button>
        <Display as="h2" style={{ fontSize: "1.4rem" }}>Today's Challenge</Display>
      </div>

      {phase === "intro" && (
        <Card className="center stack">
          <div className="big-emoji">🧠</div>
          <Display as="h3">Memory Flash</Display>
          <p className="ds-muted">You'll see {total} things for a few seconds. Remember them, then find them again. Ready?</p>
          <Button big onClick={() => setPhase("study")}>Start</Button>
        </Card>
      )}

      {phase === "study" && (
        <Card className="center stack">
          <GuideBubble>Picture each one in a silly, bright scene — that's the memory trick!</GuideBubble>
          <div className="choice-grid" style={{ justifyItems: "center" }}>
            {target.map((t) => (
              <div key={t} className="choice" aria-pressed={false} style={{ cursor: "default" }}>{t}</div>
            ))}
          </div>
          <Button big onClick={() => { setPicked([]); setPhase("recall"); }}>I've got them →</Button>
        </Card>
      )}

      {phase === "recall" && (
        <Card className="center stack">
          <p className="ds-muted">Tap the {total} you just saw ({picked.length}/{total})</p>
          <ProgressRibbon value={(picked.length / total) * 100} />
          <div className="choice-grid" style={{ justifyItems: "center", marginTop: 10 }}>
            {ICONS.map((icon) => (
              <button key={icon} className="choice" aria-pressed={picked.includes(icon)} onClick={() => togglePick(icon)}>
                {icon}
              </button>
            ))}
          </div>
          <Button big disabled={picked.length !== total} onClick={finish}>Check my memory</Button>
        </Card>
      )}

      {phase === "result" && (
        <>
          <Card className="center stack">
            <div className="big-emoji">{scenarioDay ? "🛡️" : correct === total ? "🏆" : correct >= total - 2 ? "🌟" : "💪"}</div>
            <Display as="h3">{scenarioDay ? "Safety drill done!" : `You remembered ${correct}/${total}!`}</Display>
            {!scenarioDay && <pre style={{ fontSize: "1.6rem", lineHeight: 1.2, margin: 0 }}>{glyphGrid(correct, total)}</pre>}
            <p className="ds-muted">
              {scenarioDay
                ? "You practised spotting the strong move — that's real safety craft."
                : "That grew your holding-things-in-mind skill."}{" "}
              Come back tomorrow for a fresh one!
            </p>
            <ShareButton spine={spine} name={profile.displayName} correct={correct} total={total} dateKey={key} />
            <Button variant="ghost" onClick={onBack}>Back home</Button>
          </Card>
          <WisdomCardView spine={spine} />
          <Card className="center">
            <p className="ds-muted" style={{ margin: 0 }}>Done for today! Go play outside 🌳 — your brain grows out there too.</p>
          </Card>
        </>
      )}
    </div>
  );
}

function ShareButton({
  spine,
  name,
  correct,
  total,
  dateKey: key,
}: {
  spine: Spine;
  name: string;
  correct: number;
  total: number;
  dateKey: string;
}) {
  const [msg, setMsg] = useState<string>();
  return (
    <div className="stack" style={{ width: "100%" }}>
      <Button
        big
        onClick={async () => {
          const outcome = await shareResult({ displayName: name, correct, total, dateKey: key });
          if (outcome !== "cancelled") {
            const existing = spine.store.getDaily(spine.activeProfile()!.id, key);
            if (existing) spine.store.putDaily({ ...existing, shared: true });
            spine.analytics.emit({ kind: "daily", action: "shared", challengeId: `mem-${key}` });
            setMsg(outcome === "shared" ? "Shared!" : "Copied — paste it into WhatsApp or a family chat.");
          }
        }}
      >
        📣 Share {name}'s result
      </Button>
      {msg && <p className="ds-muted">{msg}</p>}
    </div>
  );
}
