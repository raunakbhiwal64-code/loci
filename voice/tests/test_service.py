import io
import json
import sys
import time
import zipfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import os

os.environ["VOICE_ENGINE"] = "fake"
os.environ["VOICE_WORKDIR"] = str(Path(__file__).parent / ".work")

import app as app_mod  # noqa: E402
import service  # noqa: E402
from engine import FakeEngine  # noqa: E402

LINES = [
    {"id": "fruits/apple", "lang": "en", "text": "Apple. Apple!"},
    {"id": "fruits/apple", "lang": "hi", "text": "सेब। सेब!"},
    {"id": "where/cow", "lang": "en", "text": "Where is the cow?"},
]


def refs(tmp_path):
    out = {}
    for lang in ("en", "hi"):
        p = tmp_path / f"ref_{lang}"
        p.write_bytes(b"RIFF....fake")
        out[lang] = p
    return out


def test_run_job_zips_clips_and_deletes_references(tmp_path):
    r = refs(tmp_path)
    res = service.run_job(r, service.parse_lines(LINES), FakeEngine(), tmp_path / "w", fmt="wav")
    assert all(not p.exists() for p in r.values())
    names = zipfile.ZipFile(res.zip_path).namelist()
    assert "en/fruits__apple.wav" in names and "hi/fruits__apple.wav" in names and "manifest.json" in names
    assert res.stats["lines"] == 3 and res.stats["lines_by_lang"] == {"en": 2, "hi": 1}
    assert res.stats["gpu_seconds"] >= 0


def test_m4a_output_is_real_aac(tmp_path):
    res = service.run_job(refs(tmp_path), service.parse_lines(LINES[:1]), FakeEngine(), tmp_path / "w")
    data = zipfile.ZipFile(res.zip_path).read("en/fruits__apple.m4a")
    assert b"ftyp" in data[:16]


def test_references_deleted_even_when_job_fails(tmp_path):
    class Boom(FakeEngine):
        def generate(self, *a):
            raise RuntimeError("model crashed")

    r = refs(tmp_path)
    with pytest.raises(RuntimeError):
        service.run_job(r, service.parse_lines(LINES), Boom(), tmp_path / "w", fmt="wav")
    assert all(not p.exists() for p in r.values())
    assert not list((tmp_path / "w").glob("*.zip"))


def test_log_contains_no_text(tmp_path, caplog):
    caplog.set_level("INFO", logger="voice")
    service.run_job(refs(tmp_path), service.parse_lines(LINES), FakeEngine(), tmp_path / "w", fmt="wav")
    assert "job_done" in caplog.text and "Apple" not in caplog.text and "सेब" not in caplog.text


@pytest.mark.parametrize("bad", [
    [], [{"id": "a", "lang": "fr", "text": "x"}], [{"id": "a b", "lang": "en", "text": "x"}],
    [{"id": "a", "lang": "en", "text": ""}], [{"id": "a", "lang": "en", "text": "x" * 301}],
    [{"id": "a", "lang": "en", "text": "x"}, {"id": "a", "lang": "en", "text": "y"}], [{"lang": "en"}],
])
def test_invalid_lines_rejected(bad):
    with pytest.raises(service.JobError):
        service.parse_lines(bad)


def test_missing_reference_for_a_language(tmp_path):
    r = refs(tmp_path)
    r.pop("hi")
    with pytest.raises(service.JobError):
        service.run_job(r, service.parse_lines(LINES), FakeEngine(), tmp_path / "w", fmt="wav")


def test_http_flow_and_server_copy_deleted_after_download():
    c = TestClient(app_mod.app)
    files = {"ref_en": ("a.wav", b"x"), "ref_hi": ("b.wav", b"y")}
    r = c.post("/jobs", data={"lines": json.dumps(LINES)}, files=files)
    assert r.status_code == 202
    jid = r.json()["id"]
    for _ in range(100):
        s = c.get(f"/jobs/{jid}").json()
        if s["status"] in ("done", "error"):
            break
        time.sleep(0.1)
    assert s["status"] == "done", s
    z = c.get(f"/jobs/{jid}/zip")
    assert z.status_code == 200 and zipfile.ZipFile(io.BytesIO(z.content)).testzip() is None
    assert c.get(f"/jobs/{jid}").status_code == 404
    assert not (app_mod.ROOT / jid).exists()


def test_http_rejects_bad_lines_and_missing_ref():
    c = TestClient(app_mod.app)
    assert c.post("/jobs", data={"lines": "[]"}).status_code == 422
    r = c.post("/jobs", data={"lines": json.dumps(LINES)}, files={"ref_en": ("a.wav", b"x")})
    assert r.status_code == 422 and "hi" in r.json()["detail"]


def test_token_required_when_set(monkeypatch):
    monkeypatch.setenv("VOICE_TOKEN", "secret")
    c = TestClient(app_mod.app)
    assert c.get("/jobs/nope").status_code == 401
    assert c.get("/jobs/nope", headers={"Authorization": "Bearer secret"}).status_code == 404
