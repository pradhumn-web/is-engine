from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .document_parser import parse_document
from .pdf_generator import generate_report
from .rag_engine import RAGEngine

DATA_PATH = Path(__file__).parent / "data" / "bis_standards.json"
PROJECT_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_DIR = Path(os.environ.get("BIS_FRONTEND_DIR", str(PROJECT_ROOT / "frontend" / "dist"))).resolve()
DATA = json.loads(DATA_PATH.read_text(encoding="utf-8"))
STANDARDS = DATA["standards"]
ENGINE = RAGEngine(STANDARDS)
ANALYSES: list[dict[str, Any]] = []
app = FastAPI(
    title="BIS.SPEC Compliance Workbench",
    version="1.0.0",
    description="Reference-grade BIS standards retrieval and procurement compliance screening.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    procurement_text: str = Field(min_length=1, max_length=200_000)
    domain_filter: str | None = None
    top_k: int = Field(default=5, ge=1, le=20)
    role: str = Field(default="both", pattern="^(officer|contractor|both)$")


def _analyze(
    text: str,
    domain_filter: str | None,
    top_k: int,
    role: str,
    filename: str | None = None,
) -> dict[str, Any]:
    if domain_filter and domain_filter.lower() not in {s["domain"].lower() for s in STANDARDS}:
        raise HTTPException(422, detail="Unknown domain filter")
    result = ENGINE.analyze(text, domain_filter, top_k, role)
    result["generated_at"] = datetime.now(timezone.utc).isoformat()
    if filename:
        result["source_filename"] = filename
    ANALYSES.append(result)
    return result


@app.get("/health")
def health():
    return {"status": "healthy", "standards_loaded": len(STANDARDS), "version": app.version}


@app.post("/api/v1/analyze")
def analyze(request: AnalyzeRequest):
    return _analyze(request.procurement_text, request.domain_filter, request.top_k, request.role)


@app.post("/api/v1/analyze-file")
async def analyze_file(
    file: UploadFile = File(...),
    domain_filter: str | None = Form(default=None),
    role: str = Form(default="both"),
    top_k: int = Form(default=5),
):
    if role not in {"officer", "contractor", "both"}:
        raise HTTPException(422, detail="role must be officer, contractor, or both")
    if not 1 <= top_k <= 20:
        raise HTTPException(422, detail="top_k must be between 1 and 20")
    content = await file.read(15 * 1024 * 1024 + 1)
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(413, detail="File exceeds 15 MB limit")
    try:
        parsed = parse_document(file.filename or "upload.txt", content)
    except ValueError as exc:
        raise HTTPException(422, detail=str(exc)) from exc
    return _analyze(parsed["text"], domain_filter, top_k, role, parsed["filename"])


@app.get("/api/v1/standards")
def list_standards(search: str | None = None, domain: str | None = None):
    results = STANDARDS
    if domain:
        results = [s for s in results if domain.lower() in s["domain"].lower()]
    if search:
        query = search.lower()
        results = [s for s in results if query in json.dumps(s, ensure_ascii=False).lower()]
    return {
        "count": len(results),
        "domains": sorted({s["domain"] for s in STANDARDS}),
        "standards": results,
        "metadata": DATA.get("metadata", {}),
    }


@app.get("/api/v1/standards/{is_code:path}")
def get_standard(is_code: str):
    normalized = is_code.lower().replace(" ", "")
    for standard in STANDARDS:
        if standard["is_code"].lower().replace(" ", "") == normalized:
            return standard
    raise HTTPException(404, detail="Standard not found")


@app.post("/api/v1/export-report")
def export_report(payload: dict[str, Any]):
    try:
        content = generate_report(payload)
    except Exception as exc:
        raise HTTPException(422, detail=f"Could not generate report: {exc}") from exc
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="bis-compliance-audit.pdf"'},
    )


@app.get("/api/v1/analytics")
def analytics():
    domains: dict[str, int] = {}
    for standard in STANDARDS:
        domains[standard["domain"]] = domains.get(standard["domain"], 0) + 1
    citations: dict[str, int] = {}
    nonconformance: dict[str, int] = {}
    for audit in ANALYSES:
        for recommendation in audit.get("recommendations", [])[:3]:
            code = recommendation["standard"]["is_code"]
            citations[code] = citations.get(code, 0) + 1
        for row in audit.get("compliance_matrix", []):
            if row["status"] != "Aligned":
                key = row["parameter"]
                nonconformance[key] = nonconformance.get(key, 0) + 1
    return {
        "standards_count": len(STANDARDS),
        "analyses_count": len(ANALYSES),
        "domain_distribution": domains,
        "frequently_cited_standards": sorted(
            [{"is_code": key, "count": value} for key, value in citations.items()],
            key=lambda row: row["count"],
            reverse=True,
        )[:10],
        "prevalent_nonconformances": sorted(
            [{"parameter": key, "count": value} for key, value in nonconformance.items()],
            key=lambda row: row["count"],
            reverse=True,
        )[:10],
    }


if FRONTEND_DIR.is_dir():
    assets_dir = FRONTEND_DIR / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

    @app.get("/", include_in_schema=False)
    def serve_homepage():
        return FileResponse(FRONTEND_DIR / "index.html")

    @app.get("/{asset_path:path}", include_in_schema=False)
    def serve_frontend(asset_path: str):
        if asset_path == "api" or asset_path.startswith("api/"):
            raise HTTPException(404, detail="API route not found")
        candidate = (FRONTEND_DIR / asset_path).resolve()
        if not candidate.is_relative_to(FRONTEND_DIR):
            raise HTTPException(404, detail="Not found")
        if candidate.is_file():
            return FileResponse(candidate)
        if Path(asset_path).suffix:
            raise HTTPException(404, detail="File not found")
        return FileResponse(FRONTEND_DIR / "index.html")
