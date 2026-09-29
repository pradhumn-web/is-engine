# BIS.SPEC — Technical Approach for SIH

## 1. Solution overview

**BIS.SPEC** is a procurement-screening prototype that helps tender buyers and suppliers discover potentially relevant Indian Standards (IS) and review specification-level evidence gaps. Its core flow is:

> Tender text or document → extracted technical signals → ranked candidate standards → clause-by-clause screening → role-specific review and report export.

The solution focuses on explainable retrieval and deterministic checks over a small, curated demonstration corpus. It is intended to support human review—not replace BIS, engineering, legal, or procurement decisions.

## 2. Problem addressed

Procurement specifications are long, inconsistent, and often mix product descriptions, standards references, performance limits, tests, certification conditions, and documentary evidence. A buyer may need to identify the relevant standard and write clear acceptance requirements; a supplier may need to find gaps before submitting an offer. Manual cross-checking can be time-consuming, and an omitted edition, test report, or licence condition can create avoidable risk.

BIS.SPEC turns this into a repeatable first-pass workflow: identify likely standards, show why they ranked, compare tender language with structured reference clauses, and present practical review checklists for both sides.

## 3. Users and intended outcome

- **Buyer / tender officer:** screen a draft specification, review the leading standards candidates, inspect possible gaps or revision warnings, and use draft clause language as a starting point.
- **Bidder / contractor:** review the indicative compliance matrix, see what evidence may be missing, and organize supporting documents before bid submission.
- **SIH evaluator / project team:** explore the end-to-end workflow using representative examples and inspect the transparent prototype boundaries.

## 4. System architecture

```text
┌─────────────────────────────────────┐
│ React + Vite web workbench          │
│ Input · examples · roles · results  │
└──────────────────┬──────────────────┘
                   │ JSON / multipart HTTP
                   ▼
┌─────────────────────────────────────┐
│ FastAPI REST service                │
│ validation · upload · catalog · PDF │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ Document and signal processing      │
│ PDF/DOCX/TXT extraction · regex     │
│ technical parameter extraction      │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ In-memory standards index           │
│ BM25 + TF-IDF cosine + exact boosts │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ Rule-based clause screening         │
│ alignment · missing · deviation     │
│ officer and contractor views        │
└──────────────────┬──────────────────┘
                   ▼
      Ranked results · audit PDF · JSON
```

The frontend calls the API; it does not connect to external AI or standards services. At startup, the backend loads `backend/app/data/bis_standards.json` and builds the search indexes in memory.

## 5. Technical workflow

### 5.1 Input and document extraction

The user may paste specification text or upload a `.pdf`, `.docx`, or `.txt` file. The API accepts a maximum upload size of **15 MB**. Text files are decoded; DOCX paragraph and table text is collected; PDFs are processed with `pypdf` and a best-effort fallback extractor. Scanned PDFs that contain no extractable text require OCR, which is **not** implemented in this prototype.

The parser can label common sections such as scope, technical specifications, testing, and compliance. In the current analysis path, however, matching uses the extracted full text; the section labels are not yet used to weight or route retrieval.

### 5.2 Technical parameter extraction

A set of regular expressions extracts signals such as:

- IS codes and editions (for example, `IS 1786:2008`)
- product grades (for example, `Fe 500D`, `E250`)
- voltage, strength, elongation, temperature, and dimensions
- chemical-limit expressions
- testing and certification terms such as tensile, bend, NABL, BIS licence, and QCO

These extracted values are displayed as engineering signals and can inform review. Extraction is pattern-based: it is not a general-purpose language-understanding model and can miss values expressed in unusual formats or context.

### 5.3 Hybrid candidate retrieval

Each catalog entry is indexed as a composite of its IS code, title, domain, scope, keywords, and mandatory-clause text. For a user query, three signals are combined:

1. **TF-IDF cosine similarity (45%)** — word-level TF-IDF features with 1–3 word n-grams, sublinear term-frequency scaling, English stop-word removal, and a 5,000-feature cap. Cosine similarity measures the normalized dot product between the query vector and each standard record.
2. **BM25 (35%)** — a lexical relevance score using term frequency, inverse document frequency, and document-length normalization; the implementation uses `k1 = 1.5` and `b = 0.75`. Scores are normalized against the top BM25 score for the query.
3. **Exact-identifier / parameter boost (20%)** — boosts exact IS-code matches and selected high-value product or grade expressions, including examples such as Fe 500D, E250, 1.1 kV, and 1.5 TR.

The implemented ranking formula is:

```text
combined score = 0.45 × TF-IDF cosine
               + 0.35 × normalized BM25
               + 0.20 × exact-match boost
```

The API returns up to five candidates by default and supports an optional domain filter. The prototype converts the combined score into a percentage and a High/Medium/Low display tier. **That percentage is a ranking score, not a calibrated probability, compliance score, or certification decision.**

The present system uses sparse lexical vectors and rules; it does **not** use dense language-model embeddings, an LLM, or generated explanations. “RAG engine” is the code module’s name for retrieval and orchestration, not a claim that generative AI is currently answering the user.

### 5.4 Clause-level screening

For each retrieved candidate, the compliance checker compares the tender text with structured clauses from that catalog record. It uses keyword-cue overlap, whether the IS code is explicitly mentioned, whether expected certification evidence is named, clause criticality, selected numeric maximum thresholds, and a narrow sentence-level check for explicit absence-of-evidence language. When a matching clause is accompanied by nearby wording such as “no report attached” or “not provided,” that check forces a Missing status instead of interpreting keyword presence as proof. This is a targeted prototype safeguard, not general natural-language negation handling.

Each clause receives one of four screening labels:

- **Aligned:** the prototype finds sufficient cue overlap (or a cited code plus a cue).
- **Partial:** it finds some but not enough evidence, or the rule does not support a stronger conclusion.
- **Missing:** a critical clause lacks a required signal, or a certification clause has no recognizable supporting evidence.
- **Deviated:** a detected tender value exceeds a numeric maximum supplied in the reference record for a matching clause topic.

The contractor readiness score is calculated from the rule-based matrix: Aligned = 1 point, Partial = 0.5, Missing and Deviated = 0; the total is normalized to a percentage. Prototype verdict bands are based on that score. These are **heuristic demo rules**, not validated pass/fail logic. A score must never be represented as an official bid-responsiveness result.

### 5.5 Role-specific guidance and outputs

The analysis response includes both perspectives:

- **Officer view:** vendor evidence checklist, draft tender clauses for SCC/testing/ITB, and revision-code warnings.
- **Contractor view:** readiness indicator, compliance matrix, required evidence, and conditional equivalence notes.

The role selector presents distinct Officer and Bidder desks. In this demonstration build, the bidder may enter self-reported experience and a primary technical field; the profile stays in this browser and is shown to the Officer workspace without being sent to the analysis API. The Officer interface offers the audit report control; the Bidder interface hides it as a presentation choice, not an authorization boundary. Catalogue-only records do not receive a clause-readiness score or imply audit completion. The UI also provides the standards directory, session analytics and side-by-side wording comparison.

The workbench includes two different, fictional, text-extractable PDF examples: an Officer-side tender specification and a deliberately incomplete Bidder technical offer. A successful document analysis records the sanitized filename, role, top standard match, bounded extracted-parameter summary, and separate Officer/Bidder findings in browser-local storage. It does not retain the uploaded bytes or full extracted tender text in this history feature. Switching role in the same browser lets an Officer inspect a Bidder PDF run; this is a demo aid, not durable or synchronized history.

## 6. Data and knowledge base

The demonstration catalog is a local JSON file with **50 searchable entries across five domains**: 20 curated demonstration records and 30 additional BIS-sourced code/title discovery records. The curated 20 contain selected example clause summaries, test methods and illustrative screening fields; the added 30 are explicitly `catalogue_only`, have no populated clause summaries, set QCO status to unknown (`null`), and are excluded from clause-level readiness interpretation. All 50 are for discovery/demonstration, are **not a complete reproduction of BIS standards**, and do not constitute an official or automatically updated BIS register.

Before operational use, each record should be checked by a qualified reviewer against the current BIS catalogue, standard text and amendments, product scope, and applicable ministry notifications/QCOs. Added titles were cross-checked against official BIS published-standard and product-manual/registration listings, but listing presence does not validate current scope or QCO applicability. The data file carries this qualification and references the BIS source pages.

## 7. API surface

| Endpoint | Purpose |
|---|---|
| `GET /health` | Service health and loaded-catalog count. |
| `POST /api/v1/analyze` | Analyze pasted text using a validated JSON request. |
| `POST /api/v1/analyze-file` | Extract and analyze a PDF, DOCX, or TXT upload. |
| `GET /api/v1/standards` | List or search catalog records; optional domain filter. |
| `GET /api/v1/standards/{is_code}` | Look up one catalog record by IS code. |
| `POST /api/v1/export-report` | Generate a PDF audit report from analysis results. |
| `GET /api/v1/analytics` | Return counts over the in-memory standards catalog and analyses. |

Request validation includes text length, domain, role, result-count, and file-size constraints. FastAPI exposes the interactive API documentation at `/docs` while the backend is running.

## 8. Technology choices

- **Frontend:** React, Vite, JavaScript, CSS, and Lucide icons.
- **API:** Python, FastAPI, Pydantic validation, and Uvicorn.
- **Information retrieval:** scikit-learn TF-IDF/cosine similarity plus a lightweight in-repository BM25 implementation and exact-match rules.
- **Document handling:** `pypdf` for PDF extraction and `python-docx` for DOCX extraction.
- **Report generation:** `fpdf2`.
- **Data store:** JSON corpus loaded into memory; analytics are held in process memory for the running prototype.

A persistent relational database, production authentication, central/long-term analysis history, and automated standards-feed synchronization are not part of the current implementation. The Officer history tab reads bounded (100-entry) browser-local demo bidder and upload-analysis logs; counts are descriptive and names are not verified identities. Original file bytes and full extracted tender text are not included in the upload-history records. The Bidder project tab uses static illustrative preparation scenarios and does not claim live tenders.

## 9. Verification completed

The current backend test suite contains eight checks covering:

1. Exactly 50 unique catalog records, including 30 discovery-only entries without QCO claims or clause summaries.
2. Retrieval of a new catalogue-only record without fabricating clause-audit findings.
3. Leading retrieval results for representative steel-rebar and cable queries.
4. Availability of both role views and a compliance matrix.
5. Explicitly missing evidence not being scored as aligned.
6. Valid PDF report generation.
7. Scoping a carbon-limit deviation to the chemistry-related clause.
8. Real Officer-tender and Bidder-offer PDF parsing, with lower readiness and gap labels for the incomplete Bidder offer. Frontend tests cover required profile fields, browser-local session and upload-history persistence, role-specific navigation, bounded history summaries, and the illustrative project scenarios.

The frontend production build has also been run successfully. These tests verify selected behaviors; they do not establish standards coverage, real-tender accuracy, or production readiness.

For SIH evaluation, the next useful validation is a reviewer-labelled test set of diverse tenders and known standards. Measure **Precision@5 / Recall@5** for retrieval, parameter-extraction precision and recall, clause-status agreement against reviewers, and upload success by format. Record false positives/negatives and have domain reviewers approve the expected result before tuning any weights or decision bands.

## 10. Prototype limitations and safe-use controls

- The corpus is small, illustrative, local, and manually maintained; no live BIS synchronization is implemented. Thirty discovery-only records are not clause-audited.
- Retrieval is keyword/statistics-based and may miss synonyms, context, cross-references, or complex product scope.
- Parameter extraction and compliance statuses are rule-based; only a narrow set of explicit evidence-absence statements is checked. Complex negation, units, tables, exceptions, or ambiguous sentences can still be misread.
- OCR, multilingual tender understanding, amendment-aware version resolution, and full-standard clause verification are not implemented.
- Session analytics and derived analysis results are held in server memory and are lost on restart. No durable history or account-based access control exists.
- Uploads are read and parsed by the API; derived results can include excerpts and filenames in memory. Do not submit confidential tenders or personal data to a public demo without an approved privacy/security review.
- The demo server configuration is not production hardened. Before deployment, use controlled CORS, authentication/authorization, rate and upload limits, secrets management, secure logging, tenant isolation, retention/deletion controls, and security testing.

Every result should be treated as a **screening aid**. Confirm applicable standard editions, amendments, QCO status, certificate scope, testing method, and acceptance criteria using official documents and qualified personnel.

## 11. Suggested roadmap

1. **Strengthen the corpus:** use reviewed, source-linked structured records; track edition, amendment, effective date, scope, and reviewer provenance.
2. **Create ground truth:** assemble redacted and permissioned tender examples with expert-labelled standards, parameters, and clause outcomes; publish evaluation methodology.
3. **Improve document intake:** add OCR for scanned PDFs, table-aware extraction, multilingual processing, and section-aware ranking.
4. **Improve retrieval:** evaluate synonyms and domain dictionaries; compare the current transparent baseline against a reviewed semantic-retrieval candidate; keep exact-code matching and citations visible.
5. **Improve compliance rules:** add typed units, directionality, ranges, negation handling, test-method relationships, and reviewer-confirmation states.
6. **Harden the service:** add authentication, persistent database and audit trail, access controls, privacy-aware retention, monitored deployments, backups, and production security review.
7. **Human-in-the-loop lifecycle:** require qualified approval of corpus changes and high-impact flags; allow reviewers to record corrections and build an auditable evaluation loop.

## 12. SIH presentation summary

> BIS.SPEC is an explainable procurement-screening prototype. It extracts technical signals from tender text, ranks likely standards with a transparent BM25 + TF-IDF + exact-match blend, and screens selected clause summaries using explicit rules. Its 50-entry directory has 20 illustrative clause-screening records and 30 BIS-sourced discovery-only records. The Officer desk shows an unverified, browser-local count of demo Bidder sessions; the Bidder desk offers fictional project-preparation scenarios, not live tender listings. It does not replace official BIS sources, expert judgment, identity controls, or legal compliance decisions.

## References

- Stanford, *Introduction to Information Retrieval*, “Okapi BM25: a non-binary model”: <https://nlp.stanford.edu/IR-book/html/htmledition/okapi-bm25-a-non-binary-model-1.html>
- scikit-learn, `TfidfVectorizer`: <https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html>
- scikit-learn, `cosine_similarity`: <https://scikit-learn.org/stable/modules/generated/sklearn.metrics.pairwise.cosine_similarity.html>
- BIS, Standards Search: <https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/standardsearch>
- BIS, Products under Compulsory Certification: <https://www.bis.gov.in/product-certification/products-under-compulsory-certification/>
