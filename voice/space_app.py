"""Hugging Face ZeroGPU Space entry point. Copy this file as app.py, with engine.py and service.py, into a Gradio Space.

ZeroGPU gives a free account about 5 GPU minutes a day, and caps each call, so generate one language per call
(the `lang` box) and spread a family over several days. gpu_seconds in the result is what the call used.
"""
from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path

import gradio as gr

import service
from engine import get_engine

try:
    import spaces  # only exists on Hugging Face

    gpu = spaces.GPU(duration=int(os.environ.get("HF_GPU_DURATION", "120")))
except ImportError:  # laptop: no-op decorator, so the same file runs with device=cpu

    def gpu(fn):  # type: ignore[no-redef]
        return fn


@gpu
def _generate(refs, lines, workdir):
    return service.run_job(refs, lines, get_engine(), workdir)


def generate(lang: str, ref_audio: str, lines_json: str):
    all_lines = service.parse_lines(lines_json)
    lines = [ln for ln in all_lines if lang == "both" or ln.lang == lang]
    if not lines:
        raise gr.Error("No lines for that language.")
    work = Path(tempfile.mkdtemp(prefix="ll-voice-"))
    ref = work / "ref"
    ref.write_bytes(Path(ref_audio).read_bytes())  # copied so the job can delete its own copy
    refs = {ln.lang: ref for ln in lines}
    if len(set(refs.values())) == 1 and len({ln.lang for ln in lines}) > 1:
        raise gr.Error("Use one language per call: a reference clip must match the language spoken.")
    try:
        res = _generate(refs, lines, work)
    except service.JobError as e:
        raise gr.Error(str(e)) from e
    return str(res.zip_path), json.dumps(res.stats, indent=2)


demo = gr.Interface(
    fn=generate,
    inputs=[
        gr.Radio(["en", "hi"], value="hi", label="lang"),
        gr.Audio(type="filepath", label="Reference clip (about 10 seconds, same language)"),
        gr.Textbox(lines=6, label="lines JSON: [{id, lang, text}]"),
    ],
    outputs=[gr.File(label="clips.zip"), gr.Textbox(label="job stats (gpu_seconds)")],
    title="Little Learners voice",
    flagging_mode="never",
)
if __name__ == "__main__":
    demo.launch()
