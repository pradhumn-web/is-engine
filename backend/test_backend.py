from app.main import DATA, ENGINE
from app.pdf_generator import generate_report


def test_catalog_loaded_with_exactly_50_unique_standards():
    assert len(DATA["standards"]) == 50
    assert len({s["is_code"].casefold() for s in DATA["standards"]}) == 50
    additions = [s for s in DATA["standards"] if s.get("catalogue_only")]
    assert len(additions) == 30
    assert all(s["qco_mandatory"] is None and not s["mandatory_clauses"] for s in additions)


def test_catalogue_only_standard_is_discoverable_without_fake_clause_audit():
    result = ENGINE.analyze("Supply precast concrete paving blocks, product IS 15658:2021.", top_k=1, role="contractor")
    standard = result["primary_recommendation"]["standard"]
    assert standard["is_code"] == "IS 15658:2021"
    assert standard["catalogue_only"] is True
    assert result["contractor_view"]["compliance_matrix"] == []


def test_hybrid_search_matches_rebar_and_cable_standards():
    steel = ENGINE.store.search("TMT rebars Fe 500D yield strength 500 MPa", top_k=5)
    cables = ENGINE.store.search("1.1 kV 1100V PVC insulated cable conductor", top_k=5)
    assert steel and steel[0]["standard"]["is_code"] == "IS 1786:2008", steel[:1]
    assert cables and cables[0]["standard"]["is_code"] == "IS 694:2010", cables[:1]


def test_analysis_returns_both_role_views():
    result = ENGINE.analyze("Supply Fe 500D rebar, yield strength 500 MPa, IS 1786:2008 and valid BIS licence.", top_k=3)
    assert "officer_view" in result
    assert "contractor_view" in result
    assert "compliance_matrix" in result["contractor_view"]


def test_explicit_absence_of_test_evidence_is_not_scored_as_aligned():
    text = (
        "Fe 500D reinforcement bars shall conform to IS 1786:2008. "
        "Tensile and bend evidence: no heat-wise tensile test report or bend result is attached. "
        "Heat chemistry: no carbon-equivalent analysis or mill test certificate is provided."
    )
    result = ENGINE.analyze(text, top_k=1, role="contractor")
    rows = result["primary_recommendation"]["compliance_matrix"]
    assert [row["status"] for row in rows] == ["Missing", "Missing"]
    assert result["contractor_view"]["bid_readiness_score"] == 0


def test_pdf_report_is_valid_binary_payload_over_one_kilobyte():
    result = ENGINE.analyze("Supply Fe 500D rebars per IS 1786:2008. Attach BIS licence and NABL test reports.", top_k=2)
    result["generated_at"] = "2026-09-26T00:00:00+00:00"
    result["compliance_matrix"] = result["primary_recommendation"]["compliance_matrix"]
    pdf = generate_report(result)
    assert pdf.startswith(b"%PDF-")
    assert len(pdf) > 1000


def test_carbon_limit_deviation_is_scoped_to_chemistry_clause():
    result = ENGINE.analyze("Fe 500D bars, IS 1786:2008, Carbon 0.30%", top_k=1)
    rows = result["primary_recommendation"]["compliance_matrix"]
    deviated = [row["parameter"] for row in rows if row["status"] == "Deviated"]
    assert deviated == ["Heat chemistry and weldability"]


def test_both_role_specific_demo_pdfs_parse_and_return_role_views():
    client = TestClient(app)
    fixture_dir = Path(__file__).parent / "test_fixtures"
    samples = [
        ("officer-demo-tender.pdf", "officer", "officer-tender.pdf"),
        ("bidder-demo-offer.pdf", "contractor", "bidder-offer.pdf"),
    ]
    for fixture, role, upload_name in samples:
        with (fixture_dir / fixture).open("rb") as pdf:
            response = client.post(
                "/api/v1/analyze-file",
                data={"role": role},
                files={"file": (upload_name, pdf, "application/pdf")},
            )
        assert response.status_code == 200, response.text
        result = response.json()
        assert result["requested_role"] == role
        assert result["source_filename"] == upload_name
        assert result["primary_recommendation"]["standard"]["is_code"] == "IS 1786:2008"
        assert "Fe 500D" in result["extracted_parameters"]["steel_grades"]
        assert result["officer_view"]["draft_tender_clauses"]
        assert result["contractor_view"]["compliance_matrix"]
        if role == "contractor":
            assert result["contractor_view"]["bid_readiness_score"] < 100
            assert any(row["status"] in {"Missing", "Partial"} for row in result["contractor_view"]["compliance_matrix"])
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import DATA, ENGINE, app
