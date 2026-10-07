"""Core of the voice service: turn two reference clips and a list of lines into a zip of audio clips.

The same code runs on a laptop (app.py) and as a Hugging Face ZeroGPU Space (space_app.py).
Privacy rules from the product spec:
  * reference clips are deleted as soon as the job ends, even if it fails;
  * nothing the parent said or any line of text is written to the log;
  * the zip is the only output, and the web service deletes it after download.
"""
from __future__ import annotations

import io
import json
import logging
import re
import shutil
import subprocess
import tempfile
import time
import uuid
import wave
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import numpy as np

from engine import LANGS, Engine

log = logging.getLogger("voice")

MAX_LINES = 800  # the app sends about 280 lines per language
MAX_TEXT = 300
MAX_REF_BYTES = 15 * 1024 * 1024
ID_RE = re.compile(r"^[A-Za-z0-9._/#-]{1,80}$")


class JobError(ValueError):
    """The request was wrong in a way the caller can fix."""


@dataclass(frozen=True)
class Line:
    id: str
    lang: str
    text: str


@dataclass
class JobResult:
    zip_path: Path
    stats: dict


def parse_lines(raw: str | list) -> list[Line]:
    data = json.loads(raw) if isinstance(raw, str) else raw
    if not isinstance(data, list) or not data:
        raise JobError("lines must be a non-empty list of {id, lang, text}")
    if len(data) > MAX_LINES:
        raise JobError(f"too many lines (max {MAX_LINES})")
    seen: set[tuple[str, str]] = set()
    out: list[Line] = []
    for i, item in enumerate(data):
        try:
            line = Line(str(item["id"]), str(item["lang"]), str(item["text"]).strip())
        except (KeyError, TypeError) as e:
            raise JobError(f"line {i}: needs id, lang and text") from e
        if not ID_RE.match(line.id):
            raise JobError(f"line {i}: invalid id")
        if line.lang not in LANGS:
            raise JobError(f"line {i}: lang must be one of {', '.join(LANGS)}")
        if not 0 < len(line.text) <= MAX_TEXT:
            raise JobError(f"line {i}: text must be 1 to {MAX_TEXT} characters")
        if (line.lang, line.id) in seen:
            raise JobError(f"line {i}: duplicate id for {line.lang}")
        seen.add((line.lang, line.id))
        out.append(line)
    return out


def _wav_bytes(samples: np.ndarray, sr: int) -> bytes:
    pcm = (np.clip(samples, -1, 1) * 32767).astype("<i2")
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


def _encode(samples: np.ndarray, sr: int, fmt: str) -> bytes:
    wav = _wav_bytes(samples, sr)
    if fmt == "wav":
        return wav
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg is required for m4a output (or request fmt='wav')")
    # mp4 needs a seekable output, so encode through temporary files rather than pipes.
    with tempfile.TemporaryDirectory() as d:
        src, dst = Path(d) / "in.wav", Path(d) / "out.m4a"
        src.write_bytes(wav)
        p = subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", str(src), "-c:a", "aac", "-b:a", "64k",
             "-movflags", "+faststart", str(dst)],
            capture_output=True, check=False,
        )
        if p.returncode != 0:
            raise RuntimeError("audio encoding failed")
        return dst.read_bytes()


def _safe_name(line: Line, ext: str) -> str:
    return f"{line.lang}/{line.id.replace('/', '__').replace('#', '_')}.{ext}"


def check_refs(refs: dict[str, Path], lines: list[Line]) -> None:
    for lang in {line.lang for line in lines}:
        p = refs.get(lang)
        if p is None or not p.exists():
            raise JobError(f"missing reference clip for {lang}")
        if p.stat().st_size > MAX_REF_BYTES:
            raise JobError(f"reference clip for {lang} is too large")


def run_job(
    refs: dict[str, Path],
    lines: list[Line],
    engine: Engine,
    workdir: Path,
    fmt: str = "m4a",
    on_progress: Callable[[int, int], None] | None = None,
    job_id: str | None = None,
) -> JobResult:
    """Generate every line once, zip the clips, then delete the reference clips."""
    job_id = job_id or uuid.uuid4().hex[:12]
    workdir.mkdir(parents=True, exist_ok=True)
    zip_path = workdir / f"{job_id}.zip"
    started = time.perf_counter()
    gen_seconds = 0.0
    audio_seconds = 0.0
    per_lang = {lang: 0 for lang in LANGS}
    manifest = []
    try:
        check_refs(refs, lines)
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_STORED) as z:
            for i, line in enumerate(lines):
                t0 = time.perf_counter()
                samples, sr = engine.generate(line.text, line.lang, refs[line.lang])
                gen_seconds += time.perf_counter() - t0
                seconds = len(samples) / sr
                audio_seconds += seconds
                per_lang[line.lang] += 1
                name = _safe_name(line, fmt)
                z.writestr(name, _encode(samples, sr, fmt))
                manifest.append({"id": line.id, "lang": line.lang, "file": name, "seconds": round(seconds, 2)})
                if on_progress:
                    on_progress(i + 1, len(lines))
            z.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False))
    except BaseException:
        zip_path.unlink(missing_ok=True)
        raise
    finally:
        for p in refs.values():  # the spec: reference clips are deleted as soon as the job ends
            Path(p).unlink(missing_ok=True)
    total = time.perf_counter() - started
    stats = {
        "job": job_id,
        "engine": engine.name,
        "device": engine.device,
        "lines": len(lines),
        "lines_by_lang": per_lang,
        "gpu_seconds": round(gen_seconds, 2),  # time spent inside the model: what a GPU would bill
        "total_seconds": round(total, 2),
        "audio_seconds": round(audio_seconds, 1),
        "realtime_factor": round(gen_seconds / audio_seconds, 2) if audio_seconds else None,
    }
    log.info("job_done %s", json.dumps(stats))  # numbers only: no text, no audio, no filenames
    return JobResult(zip_path, stats)
