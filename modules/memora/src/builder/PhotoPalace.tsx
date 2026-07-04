import { useEffect, useRef, useState } from "react";
import { Button, Card, Display, GuideBubble, Modal } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import {
  deleteCustomPalace,
  loadCustomPalaces,
  saveCustomPalace,
  type Palace,
  type PalaceSpot,
} from "../palaces.js";
import { downscaleFile, encodeDownscaledJpeg } from "./downscale.js";

/**
 * Build my own palace — the child photographs (or picks) a place they know,
 * then taps to drop numbered loci on it. Every photo is downscaled + re-encoded
 * as JPEG (stripping EXIF/GPS) before it is stored; the original is never kept.
 * Photos stay on this device and are never uploaded.
 *
 * Behind a simple grown-ups gate (two-digit multiplication) so a camera isn't
 * opened without an adult nearby.
 */

const PIN = "📍";
const MIN_SPOTS = 3;

type BuildStep = "source" | "camera" | "place";

export function PhotoPalace({ ctx, onExit }: { ctx: ModuleContext; onExit: () => void }) {
  const [gate, setGate] = useState(true);

  if (gate) return <GrownUpsGate onPass={() => setGate(false)} onCancel={onExit} />;
  return <Builder ctx={ctx} onExit={onExit} />;
}

/* ---------------- grown-ups gate ---------------- */

function GrownUpsGate({ onPass, onCancel }: { onPass: () => void; onCancel: () => void }) {
  const [a] = useState(() => 7 + Math.floor(Math.random() * 6));
  const [b] = useState(() => 4 + Math.floor(Math.random() * 6));
  const [answer, setAnswer] = useState("");
  const wrong = answer !== "" && Number(answer) !== a * b;

  return (
    <Modal onClose={onCancel}>
      <div className="stack center">
        <Display as="h3">Grown-ups only</Display>
        <p className="ds-muted">
          Making a photo palace uses the camera, so let's grab a grown-up first. What is {a} × {b}?
        </p>
        <input
          className="text"
          inputMode="numeric"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && Number(answer) === a * b) onPass(); }}
        />
        {wrong && <p className="ds-muted" style={{ color: "var(--bad, #c0392b)" }}>Not quite — try again.</p>}
        <div className="row" style={{ justifyContent: "center" }}>
          <Button variant="ghost" onClick={onCancel}>Back</Button>
          <Button onClick={() => { if (Number(answer) === a * b) onPass(); }}>Enter</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- the builder ---------------- */

function Builder({ ctx, onExit }: { ctx: ModuleContext; onExit: () => void }) {
  const [step, setStep] = useState<BuildStep>("source");
  const [photo, setPhoto] = useState<string | null>(null);
  const [spots, setSpots] = useState<PalaceSpot[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>("");
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const cameraSupported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function";

  const usePhoto = (dataUrl: string) => {
    setPhoto(dataUrl);
    setSpots([]);
    setError("");
    setStep("place");
  };

  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    try {
      usePhoto(await downscaleFile(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't use that picture — try another.");
    }
  };

  const addSpotAt = (xPct: number, yPct: number) => {
    setSpots((prev) => [
      ...prev,
      { id: `s${Date.now().toString(36)}${prev.length}`, label: `Spot ${prev.length + 1}`, emoji: PIN, x: xPct, y: yPct },
    ]);
  };

  const renameSpot = (id: string, label: string) => {
    setSpots((prev) => prev.map((s) => (s.id === id ? { ...s, label } : s)));
  };

  const removeSpot = (id: string) => {
    setSpots((prev) =>
      prev
        .filter((s) => s.id !== id)
        // keep default "Spot N" labels tidy after a delete
        .map((s, i) => (/^Spot \d+$/.test(s.label) ? { ...s, label: `Spot ${i + 1}` } : s))
    );
  };

  const canSave = !!photo && spots.length >= MIN_SPOTS && name.trim().length > 0;

  const save = () => {
    if (!photo || !canSave) return;
    const palace: Palace = {
      id: `custom-${Date.now().toString(36)}`,
      name: name.trim(),
      emoji: "🏠",
      photo,
      loci: spots,
    };
    saveCustomPalace(ctx.storage, palace);
    ctx.analytics.emit({ kind: "activity", action: "completed", moduleId: "memora", skills: ["spatial-visualisation"] });
    setSaved(true);
  };

  if (saved) {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">🎉</div>
          <Display as="h3">Your palace is ready!</Display>
          <p className="ds-muted">
            "{name.trim()}" now has {spots.length} spots. Pick it when you start a Palace Journey and fill it with things
            to remember.
          </p>
          <Button big onClick={onExit}>Back to Memora</Button>
        </Card>
      </div>
    );
  }

  /* -------- step: choose a photo source -------- */
  if (step === "source") {
    return (
      <div className="stack">
        <div className="crumbs">
          <Button variant="ghost" onClick={onExit}>← Back</Button>
          <Display as="h2" style={{ fontSize: "1.4rem" }}>Build my own palace</Display>
        </div>
        <GuideBubble>
          Pick a place you know really well — your room, the kitchen, your street. We'll drop numbered spots on it, then
          you can hide things to remember at each one.
        </GuideBubble>
        <p className="ds-muted">🔒 Photos stay on this device and are never uploaded.</p>
        {error && <Card style={{ borderLeft: "6px solid var(--bad, #c0392b)" }}><p className="ds-muted">{error}</p></Card>}
        <div className="tiles">
          {cameraSupported && (
            <button className="tile" onClick={() => { setError(""); setStep("camera"); }}>
              <span className="tile__emoji">📷</span>
              <span className="tile__name">Take a photo</span>
              <span className="tile__blurb">Use the camera now</span>
            </button>
          )}
          <button className="tile" onClick={() => fileInputRef.current?.click()}>
            <span className="tile__emoji">🖼️</span>
            <span className="tile__name">Choose a picture</span>
            <span className="tile__blurb">From this device</span>
          </button>
        </div>
        {!cameraSupported && (
          <p className="ds-muted" style={{ fontSize: "0.85rem" }}>
            No camera here — no problem! Choose a picture you already have.
          </p>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onFilePicked} />
      </div>
    );
  }

  /* -------- step: in-app camera -------- */
  if (step === "camera") {
    return (
      <CameraCapture
        onCancel={() => setStep("source")}
        onCaptured={usePhoto}
        onUnavailable={(msg) => {
          setError(msg);
          setStep("source");
        }}
      />
    );
  }

  /* -------- step: place the loci -------- */
  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={() => { setStep("source"); setPhoto(null); setSpots([]); }}>← Start over</Button>
        <Display as="h2" style={{ fontSize: "1.4rem" }}>Drop your spots</Display>
      </div>
      <GuideBubble>
        Tap the photo to drop a numbered spot anywhere you like. You need at least {MIN_SPOTS}. These are the loci you'll
        hide things at.
      </GuideBubble>

      {photo && <PhotoTapper photo={photo} spots={spots} onTap={addSpotAt} />}

      {spots.length > 0 && (
        <Card className="stack">
          <Display as="h3" style={{ fontSize: "1rem" }}>Your spots ({spots.length})</Display>
          {spots.map((s, i) => (
            <div key={s.id} className="row" style={{ gap: 8 }}>
              <span className="pill">{i + 1}</span>
              <input
                className="text"
                style={{ flex: 1 }}
                value={s.label}
                aria-label={`Name for spot ${i + 1}`}
                onChange={(e) => renameSpot(s.id, e.target.value)}
              />
              <Button variant="ghost" onClick={() => removeSpot(s.id)} aria-label={`Delete spot ${i + 1}`}>✕</Button>
            </div>
          ))}
        </Card>
      )}

      <Card className="stack">
        <label className="ds-muted" style={{ fontSize: "0.9rem" }}>
          Name your palace
          <input
            className="text"
            style={{ marginTop: 6 }}
            placeholder="e.g. My bedroom"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <p className="ds-muted" style={{ fontSize: "0.85rem" }}>🔒 This photo stays on this device — it's never uploaded.</p>
        <Button big disabled={!canSave} onClick={save}>
          {spots.length < MIN_SPOTS
            ? `Add ${MIN_SPOTS - spots.length} more spot${MIN_SPOTS - spots.length === 1 ? "" : "s"}`
            : !name.trim()
              ? "Name your palace to save"
              : "Save my palace ✓"}
        </Button>
      </Card>
    </div>
  );
}

/* ---------------- photo + tap-to-drop-pins ---------------- */

function PhotoTapper({
  photo,
  spots,
  onTap,
}: {
  photo: string;
  spots: PalaceSpot[];
  onTap: (xPct: number, yPct: number) => void;
}) {
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onTap(Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
  };

  return (
    <div
      onClick={handleTap}
      style={{ position: "relative", borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--line)", cursor: "crosshair" }}
    >
      <img src={photo} alt="Your palace" style={{ width: "100%", display: "block" }} />
      {spots.map((s, i) => (
        <span
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x ?? 50}%`,
            top: `${s.y ?? 50}%`,
            transform: "translate(-50%, -50%)",
            width: 30,
            height: 30,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            fontSize: 15,
            color: "#fff",
            background: "var(--accent)",
            border: "2px solid #fff",
            pointerEvents: "none",
          }}
        >
          {i + 1}
        </span>
      ))}
    </div>
  );
}

/* ---------------- in-app camera ---------------- */

function CameraCapture({
  onCaptured,
  onCancel,
  onUnavailable,
}: {
  onCaptured: (dataUrl: string) => void;
  onCancel: () => void;
  onUnavailable: (message: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) onUnavailable("Camera isn't available — choose a picture instead.");
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // onUnavailable is stable enough for this one-shot setup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snap = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    // Re-encode through canvas → strips EXIF/GPS and downscales.
    const dataUrl = encodeDownscaledJpeg(video, video.videoWidth, video.videoHeight);
    setPreview(dataUrl);
  };

  const keep = () => {
    if (preview) onCaptured(preview);
  };

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onCancel}>← Back</Button>
        <Display as="h2" style={{ fontSize: "1.4rem" }}>Take a photo</Display>
      </div>
      <GuideBubble>Point at your place and tap Snap. Don't like it? Retake as many times as you want.</GuideBubble>

      <div style={{ borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--line)" }}>
        {preview ? (
          <img src={preview} alt="Snapshot preview" style={{ width: "100%", display: "block" }} />
        ) : (
          <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block", background: "#000" }} />
        )}
      </div>

      {preview ? (
        <div className="row" style={{ justifyContent: "center" }}>
          <Button variant="ghost" onClick={() => setPreview(null)}>↺ Retake</Button>
          <Button big onClick={keep}>Use this photo →</Button>
        </div>
      ) : (
        <div className="row" style={{ justifyContent: "center" }}>
          <Button big disabled={!ready} onClick={snap}>📸 Snap</Button>
        </div>
      )}
      <p className="ds-muted" style={{ fontSize: "0.85rem", textAlign: "center" }}>
        🔒 Photos stay on this device and are never uploaded.
      </p>
    </div>
  );
}

/* ---------------- "My palaces" list (used on the module home) ---------------- */

export function MyPalaces({ ctx, onBuild }: { ctx: ModuleContext; onBuild: () => void }) {
  const [palaces, setPalaces] = useState<Palace[]>(() => loadCustomPalaces(ctx.storage));

  const remove = (id: string) => {
    deleteCustomPalace(ctx.storage, id);
    setPalaces(loadCustomPalaces(ctx.storage));
  };

  if (palaces.length === 0) return null;

  return (
    <Card className="stack">
      <Display as="h3" style={{ fontSize: "1.1rem" }}>My palaces</Display>
      {palaces.map((p) => (
        <div key={p.id} className="row" style={{ gap: 10 }}>
          {p.photo ? (
            <img src={p.photo} alt={p.name} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: "var(--r-md)" }} />
          ) : (
            <span className="tile__emoji" style={{ width: 44, textAlign: "center" }}>{p.emoji}</span>
          )}
          <div style={{ flex: 1 }}>
            <div className="tile__name" style={{ fontSize: "1rem" }}>{p.name}</div>
            <div className="ds-muted" style={{ fontSize: "0.8rem" }}>{p.loci.length} spots</div>
          </div>
          <Button variant="ghost" onClick={() => remove(p.id)} aria-label={`Delete ${p.name}`}>🗑️</Button>
        </div>
      ))}
      <Button variant="ghost" onClick={onBuild}>+ Build another</Button>
    </Card>
  );
}
