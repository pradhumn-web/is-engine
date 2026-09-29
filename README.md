# BIS.SPEC — SIH procurement intelligence prototype

A demo-ready React + FastAPI workbench for standards-based procurement screening. The entry screen lets a visitor choose a Buyer / Officer or Bidder / Contractor workspace, then opens the matching review desk with a representative Fe 500D tender and analysis ready to explore.

## Optional Render deployment setup — not published

`render.yaml` and the root `Dockerfile` prepare one optional deployment path. **The repository commit and Manus preview do not create a live Render service.** This path requires a Render account and a deliberate Blueprint setup. Once created, the service builds the React UI and FastAPI API from the same origin; Render provides a shareable HTTPS URL, with API docs at `/docs` and the SIH guide at `/sih-user-guide.html`.

To set it up, connect `pradhumn-web/is-engine` in Render and apply the Blueprint. Subsequent pushes to `main` trigger deployments automatically. The free demo service may sleep after 15 minutes of inactivity, making its first request after sleep take about a minute. Do not rely on its local filesystem or in-memory analytics for persistent data.

## Demo flow

1. Choose **Buyer / Officer** or **Bidder / Contractor** on the demo access screen; optionally add a display name.
2. Review the preloaded Fe 500D metro viaduct tender or choose one of the four example scenarios.
3. Inspect extracted parameters and hybrid-ranked standard recommendations.
4. Use **Change workspace** in the header to compare the officer’s tender and supplier-evidence review with the bidder’s readiness and compliance matrix.
5. Open clause comparison, filter conformance findings, and copy the amendment language.
6. Visit the searchable 20-entry standards catalog or session activity page, then export the audit as PDF or JSON.

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

Managed full-stack project checks: `pnpm check && pnpm test && pnpm build`.

## API routes

- `GET /health`
- `POST /api/v1/analyze` — JSON `{ "procurement_text": "...", "domain_filter": null, "top_k": 5, "role": "both" }`
- `POST /api/v1/analyze-file` — multipart `.pdf`, `.docx`, or `.txt`
- `GET /api/v1/standards?search=...&domain=...`
- `GET /api/v1/standards/{is_code}`
- `POST /api/v1/export-report` — accepts an analysis response
- `GET /api/v1/analytics`

## Prototype boundaries

The 20-entry corpus and clause summaries are indicative reference/demo data, not an authoritative BIS register. Verify live editions, amendments, QCO notifications, CRS scope and tender applicability from official sources before procurement or legal reliance. Automated analysis is not engineering, legal or certification advice. The role picker is a **demo-only workspace selector**, not account authentication: it requests no password and does not verify identity, role, or procurement authority. Its display name/role is kept in local browser storage. Analytics and indexing are in-memory; scanned PDFs are not OCR'd. The preview is not a permanent public deployment. Free hosting may sleep when idle, and all data held only in process memory resets on restart or redeploy.

## SIH submission guide

The standalone, printable walkthrough is served at `/sih-user-guide.html` and is linked from the workbench header. It covers the user flow, both procurement roles, result interpretation, prototype boundaries, demo scenario, and local setup.
