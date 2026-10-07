"""Text-to-speech engines. Each turns one line of text into audio in the voice of a reference clip."""
from __future__ import annotations

import math
import os
import threading
from pathlib import Path
from typing import Protocol

import numpy as np

LANGS = ("en", "hi")


class Engine(Protocol):
    name: str
    device: str

    def generate(self, text: str, lang: str, ref_path: Path) -> tuple[np.ndarray, int]:
        """Return mono float32 samples in [-1, 1] and the sample rate."""


class FakeEngine:
    """Sine tones whose length follows the text. For tests and for trying the pipeline with no model."""

    name = "fake"
    device = "none"

    def generate(self, text: str, lang: str, ref_path: Path) -> tuple[np.ndarray, int]:
        sr = 16000
        seconds = max(0.3, min(6.0, len(text) * 0.06))
        t = np.arange(int(sr * seconds)) / sr
        freq = 220.0 if lang == "en" else 330.0
        return (0.2 * np.sin(2 * math.pi * freq * t)).astype(np.float32), sr


class ChatterboxEngine:
    """Chatterbox Multilingual (MIT licence, supports Hindi). Output carries Resemble's inaudible watermark.

    The reference clip must be in the same language as the line, otherwise the accent carries over.
    """

    name = "chatterbox-multilingual"

    def __init__(self, device: str = "cpu") -> None:
        # Imported here so the service starts (and tests run) without torch installed.
        import torch  # noqa: PLC0415
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS  # noqa: PLC0415

        if device == "auto":
            device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
        self.device = device
        self._model = ChatterboxMultilingualTTS.from_pretrained(device=device)

    def generate(self, text: str, lang: str, ref_path: Path) -> tuple[np.ndarray, int]:
        wav = self._model.generate(text, language_id=lang, audio_prompt_path=str(ref_path))
        return wav.squeeze().detach().cpu().numpy().astype(np.float32), int(self._model.sr)


_engine: Engine | None = None
_lock = threading.Lock()


def get_engine() -> Engine:
    """One shared engine per process; the model takes a while to load, so load it once."""
    global _engine
    with _lock:
        if _engine is None:
            kind = os.environ.get("VOICE_ENGINE", "chatterbox")
            _engine = FakeEngine() if kind == "fake" else ChatterboxEngine(os.environ.get("VOICE_DEVICE", "cpu"))
        return _engine
