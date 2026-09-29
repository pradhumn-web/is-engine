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
