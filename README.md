# BIS.SPEC — SIH procurement intelligence prototype

A demo-ready React + FastAPI workbench for standards-based procurement screening. The landing screen loads a representative Fe 500D metro-rebar tender and runs the analysis automatically, so a live showcase begins with extracted engineering signals, recommended standards and an officer view already populated.

## Live prototype

- Workbench: https://5173-im1oqjpabm3z96o5dr55w-849b52dc.sg2.manus.computer/
- API docs: https://8000-im1oqjpabm3z96o5dr55w-849b52dc.sg2.manus.computer/docs

## Demo flow

1. Review the preloaded Fe 500D metro viaduct tender or choose one of the four example scenarios.
2. Inspect extracted parameters and hybrid-rank standard recommendations.
3. Toggle **Buyer / Officer** and **Bidder / Contractor** modes to compare tender drafting and qualification guidance with bid readiness and the clause matrix.
4. Open clause comparison, filter conformance findings, and copy the amendment language.
5. Visit the searchable 20-entry standards catalog or session analytics dashboard.
6. Export the audit as PDF or JSON.

## Start locally

Backend (Python 3.10+):

```bash
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Frontend (Node 20+):

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Vite proxies `/api` and `/health` to `127.0.0.1:8000`. API docs are at `http://localhost:8000/docs`.

## Tests

```bash
cd backend
PYTHONPATH=. pytest -q test_backend.py
cd ../frontend
npm run build
```

## API routes

- `GET /health`
- `POST /api/v1/analyze` — JSON `{ "procurement_text": "...", "domain_filter": null, "top_k": 5, "role": "both" }`
- `POST /api/v1/analyze-file` — multipart `.pdf`, `.docx`, or `.txt`
- `GET /api/v1/standards?search=...&domain=...`
- `GET /api/v1/standards/{is_code}`
- `POST /api/v1/export-report` — accepts an analysis response
- `GET /api/v1/analytics`

## Prototype boundaries

The 20-entry corpus and clause summaries are indicative reference/demo data, not an authoritative BIS register. Verify live editions, amendments, QCO notifications, CRS scope and tender applicability from official sources before procurement or legal reliance. Automated analysis is not engineering, legal or certification advice. Analytics and indexing are in-memory; scanned PDFs are not OCR'd. The public preview is served from a temporary sandbox and is not a permanent production deployment.

## SIH submission guide

The standalone, printable walkthrough is served at `/sih-user-guide.html` and is linked from the workbench header. It covers the user flow, both procurement roles, result interpretation, prototype boundaries, demo scenario, and local setup.
