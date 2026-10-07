# Little Learners voice service

Clones a parent's voice from a short reference clip and generates every narration line once, using
Chatterbox Multilingual (MIT licence, supports Hindi; output carries an inaudible watermark). The app stores the
clips on the phone. Reference clips are deleted as soon as a job ends, and no text or audio is logged.

## Run on your laptop (CPU)

```bash
cd voice
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt "setuptools<81"   # setuptools pin: the watermarker needs pkg_resources
export VOICE_DEVICE=cpu                            # or auto / cuda / mps
uvicorn app:app --port 8787
```

`VOICE_ENGINE=fake` runs the whole pipeline with tones instead of the model (used by the tests):
`pip install -r requirements-dev.txt && VOICE_ENGINE=fake pytest tests`.

API: `POST /jobs` (multipart `ref_en`, `ref_hi`, `lines` JSON) → `{id}`; `GET /jobs/{id}` for progress;
`GET /jobs/{id}/zip` downloads the clips and deletes the server copy. Set `VOICE_TOKEN` to require a bearer token and
`VOICE_CORS_ORIGINS` to allow the web app's address.

## Run as a free Hugging Face ZeroGPU Space

Create a Gradio Space on ZeroGPU hardware and upload `engine.py`, `service.py`, `space_app.py` (renamed `app.py`)
and `requirements.txt`. The free quota is about 5 GPU minutes a day, so generate one language per call.

## Lines to generate

`npm run export-lines` (repo root) writes `voice/lines.json`: 313 lines per language (pages, word prompts, game
feedback, missions). English lines use the default UK spelling.

## Measured cost (one spike, not a benchmark)

4 lines (2 English, 2 Hindi, 9.6 s of audio) on a 4-core CPU with no GPU: 45 s of model time, about 4.7 s of compute
per second of audio, with a 26 s model load. At that speed a full family (626 lines) would take roughly 2 hours on
this class of CPU. GPU time per family still has to be measured on a ZeroGPU Space; each job logs `gpu_seconds` for that.
The reference clip in this spike was the model's own default voice, so clone quality and Hindi pronunciation are not yet judged.

## Not done

- Hindi fine-tune checkpoint: the engine uses the stock multilingual model with `language_id="hi"`; loading a Hindi
  fine-tune is untested.
- Voice Studio in the app (consent, random-sentence check, spot-check, replace) is the next step.
