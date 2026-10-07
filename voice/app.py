"""Laptop / server entry point.   uvicorn app:app --port 8787

POST /jobs        multipart: ref_en, ref_hi (audio files), lines (JSON)  -> {id}
GET  /jobs/{id}   -> {status, done, total, stats?, error?}
GET  /jobs/{id}/zip   the finished clips; the server copy is deleted once sent
DELETE /jobs/{id}     cancel and delete everything
Set VOICE_TOKEN to require "Authorization: Bearer <token>".
"""
from __future__ import annotations

import logging
import os
import shutil
import tempfile
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fastapi import BackgroundTasks, Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

import service
from engine import LANGS, get_engine

logging.basicConfig(level=logging.INFO, format="%(message)s")
ROOT = Path(os.environ.get("VOICE_WORKDIR", tempfile.gettempdir())) / "little-learners-voice"
TTL = 3600  # finished jobs nobody downloaded are deleted after an hour

app = FastAPI(title="Little Learners voice service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("VOICE_CORS_ORIGINS", "http://localhost:5173,http://localhost:4173").split(","),
    allow_methods=["*"], allow_headers=["*"],
)
pool = ThreadPoolExecutor(max_workers=1)  # one model, one job at a time
jobs: dict[str, dict] = {}
jobs_lock = threading.Lock()


def auth(authorization: str | None = Header(default=None)) -> None:
    token = os.environ.get("VOICE_TOKEN")
    if token and authorization != f"Bearer {token}":
        raise HTTPException(401, "unauthorized")


def _drop(job_id: str) -> None:
    with jobs_lock:
        jobs.pop(job_id, None)
    shutil.rmtree(ROOT / job_id, ignore_errors=True)


def _sweep() -> None:
    now = time.time()
    for jid, j in list(jobs.items()):
        if now - j["created"] > TTL:
            _drop(jid)


def _work(job_id: str, refs: dict[str, Path], lines: list[service.Line]) -> None:
    j = jobs[job_id]
    j["status"] = "running"
    try:
        def progress(done: int, total: int) -> None:
            j["done"], j["total"] = done, total

        res = service.run_job(refs, lines, get_engine(), ROOT / job_id, on_progress=progress, job_id=job_id)
        j.update(status="done", stats=res.stats, zip=str(res.zip_path))
    except Exception as e:  # noqa: BLE001
        j.update(status="error", error=str(e) if isinstance(e, service.JobError) else "generation failed")
        logging.exception("job_failed %s", job_id)


@app.get("/health")
def health() -> dict:
    return {"ok": True, "engine": os.environ.get("VOICE_ENGINE", "chatterbox")}


@app.post("/jobs", status_code=202, dependencies=[Depends(auth)])
async def create_job(
    lines: str = Form(...),
    ref_en: UploadFile | None = File(default=None),
    ref_hi: UploadFile | None = File(default=None),
) -> dict:
    _sweep()
    try:
        parsed = service.parse_lines(lines)
    except (service.JobError, ValueError) as e:
        raise HTTPException(422, str(e)) from e
    job_id = uuid.uuid4().hex[:12]
    folder = ROOT / job_id
    folder.mkdir(parents=True)
    refs: dict[str, Path] = {}
    try:
        for lang, up in zip(LANGS, (ref_en, ref_hi)):
            if up is None:
                continue
            data = await up.read(service.MAX_REF_BYTES + 1)
            if len(data) > service.MAX_REF_BYTES:
                raise service.JobError(f"reference clip for {lang} is too large")
            p = folder / f"ref_{lang}"
            p.write_bytes(data)
            refs[lang] = p
        service.check_refs(refs, parsed)
    except service.JobError as e:
        shutil.rmtree(folder, ignore_errors=True)
        raise HTTPException(422, str(e)) from e
    with jobs_lock:
        jobs[job_id] = {"status": "queued", "done": 0, "total": len(parsed), "created": time.time()}
    pool.submit(_work, job_id, refs, parsed)
    return {"id": job_id}


@app.get("/jobs/{job_id}", dependencies=[Depends(auth)])
def job_status(job_id: str) -> dict:
    j = jobs.get(job_id)
    if not j:
        raise HTTPException(404, "no such job")
    return {k: v for k, v in j.items() if k in ("status", "done", "total", "stats", "error")}


@app.get("/jobs/{job_id}/zip", dependencies=[Depends(auth)])
def job_zip(job_id: str, bg: BackgroundTasks) -> FileResponse:
    j = jobs.get(job_id)
    if not j or j["status"] != "done":
        raise HTTPException(404, "not ready")
    bg.add_task(_drop, job_id)  # server copy deleted after download
    return FileResponse(j["zip"], media_type="application/zip", filename="clips.zip")


@app.delete("/jobs/{job_id}", status_code=204, dependencies=[Depends(auth)])
def job_delete(job_id: str) -> None:
    _drop(job_id)
