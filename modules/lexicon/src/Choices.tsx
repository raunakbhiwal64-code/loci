import type { CSSProperties } from "react";

/**
 * Answer options with warm, non-punitive feedback: once picked, the right
 * answer glows green and a wrong pick turns soft red — never dramatic.
 */
export function Choices({
  options,
  picked,
  correctIndex,
  onPick,
}: {
  options: string[];
  picked: number | null;
  correctIndex: number;
  onPick: (index: number) => void;
}) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      {options.map((option, i) => {
        const state: OptionState =
          picked === null ? "idle" : i === correctIndex ? "right" : i === picked ? "wrong" : "dim";
        return (
          <button
            key={`${i}-${option}`}
            type="button"
            style={optionStyle(state)}
            disabled={picked !== null}
            onClick={() => onPick(i)}
          >
            {state === "right" && picked !== null ? "✓ " : state === "wrong" ? "✗ " : ""}
            {option}
          </button>
        );
      })}
    </div>
  );
}

type OptionState = "idle" | "right" | "wrong" | "dim";

function optionStyle(state: OptionState): CSSProperties {
  const base: CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "1rem",
    textAlign: "left",
    padding: "12px 16px",
    borderRadius: "var(--r-md)",
    border: "2px solid var(--line)",
    background: "var(--surface)",
    color: "var(--ink)",
    cursor: "pointer",
    transition: "border-color var(--dur) ease, background var(--dur) ease",
  };
  if (state === "right") return { ...base, borderColor: "#2e7d32", background: "#e6f4ea", cursor: "default" };
  if (state === "wrong") return { ...base, borderColor: "#c62828", background: "#fdecea", cursor: "default" };
  if (state === "dim") return { ...base, opacity: 0.55, cursor: "default" };
  return base;
}
