from __future__ import annotations

import re
from typing import Any


def extract_parameters(text: str) -> dict[str, Any]:
    patterns = {
        "is_codes": r"\bIS\s*\d{3,5}(?:\s*\([^)]*\))?(?:\s*:\s*\d{4})?",
        "steel_grades": r"\b(?:Fe\s*\d{3,4}\s*[A-Z]?|E\s*\d{3}\s*[A-Z]?(?:\s*[A-Z]\d)?)\b",
        "voltage": r"\b(?:\d+(?:\.\d+)?\s*(?:V|kV)|1100\s*V)\b",
        "strength": r"\b(?:yield|tensile)?\s*(?:strength\s*)?\d+(?:\.\d+)?\s*(?:MPa|N/mm2)\b",
        "elongation": r"\b\d+(?:\.\d+)?\s*%\s*(?:elongation)?\b",
        "temperature": r"\b-?\d+(?:\.\d+)?\s*°?\s*(?:C|F)\b",
        "chemical_limits": r"\b(?:carbon|sulphur|sulfur|phosphorus|chloride|fluoride)\s*(?:content|maximum|max|≤|<|=)?\s*\d+(?:\.\d+)?\s*%?\b",
        "dimensions": r"\b\d+(?:\.\d+)?\s*(?:mm|cm|m|inch|inches|NB)\b",
        "testing": r"\b(?:hydrostatic|tensile|impact|bend|dielectric|insulation resistance|compressive|NABL|mill test)\b",
        "certifications": r"\b(?:BIS licence|BIS license|ISI mark|CRS registration|NABL|QAP|QCO|test certificate)\b",
    }
    out: dict[str, Any] = {}
    for key, pattern in patterns.items():
        vals = list(dict.fromkeys(m.group(0).strip() for m in re.finditer(pattern, text, re.I)))
        if vals:
            out[key] = vals
    return out


def check_compliance(text: str, standard: dict[str, Any]) -> dict[str, Any]:
    lower = text.lower()
    params = extract_parameters(text)
    code = standard["is_code"].lower()
    code_mentioned = code in lower or re.sub(r"[^a-z0-9]", "", code) in re.sub(r"[^a-z0-9]", "", lower)
    matrix = []
    for clause in standard.get("mandatory_clauses", []):
        title = clause["title"]
        requirement = clause["requirement"]
        cues = set(re.findall(r"[a-z]{5,}", (title + " " + requirement).lower()))
        hits = sum(1 for cue in cues if cue in lower)
        critical = clause.get("criticality", "Medium").lower() in {"critical", "high"}
        certification_clause = any(k in (title + requirement).lower() for k in ("registration", "certification", "traceability", "marking"))
        if certification_clause and not any(x in lower for x in ("bis", "cm/l", "nabl", "certificate", "license", "licence", "test report")):
            status = "Missing"
        elif hits >= 3 or code_mentioned and hits >= 1:
            status = "Aligned"
        elif hits >= 1:
            status = "Partial"
        elif critical:
            status = "Missing"
        else:
            status = "Partial"
        # Detect an explicit requested numeric ceiling that is looser than a corpus threshold.
        deviation = None
        clause_text = (title + " " + requirement).lower()
        for key, expected in standard.get("key_parameters", {}).items():
            if isinstance(expected, (int, float)) and any(term in key for term in ("max", "maximum")):
                name = key.split("_max")[0].replace("_", " ")
                topic = name.split()[0]
                aliases = {"carbon": ("carbon", "chemical", "chemistry"),
                           "yield": ("yield", "tensile", "mechanical"),
                           "compressive": ("compressive", "strength"),
                           "ph": ("ph", "acidity"), "turbidity": ("turbidity",)}
                if not any(term in clause_text for term in aliases.get(topic, (topic,))):
                    continue
                match = re.search(rf"{re.escape(name)}[^\n\d]{{0,20}}(\d+(?:\.\d+)?)", lower)
                if match and float(match.group(1)) > float(expected):
                    deviation = f"Tender value {match.group(1)} exceeds reference maximum {expected}."
                    status = "Deviated"
                    break
        matrix.append({"clause_no": clause.get("clause_no"), "parameter": title,
                       "tender_requirement": _relevant_excerpt(text, title), "standard_spec": requirement,
                       "status": status, "risk_impact": clause.get("criticality", "Medium"),
                       "action_required": deviation or ("Add explicit evidence and acceptance criteria." if status in {"Missing", "Partial"} else "Retain traceable evidence with the offer."),
                       "testing_method": clause.get("testing_method")})

    total = len(matrix) or 1
    points = {"Aligned": 1.0, "Partial": 0.5, "Missing": 0.0, "Deviated": 0.0}
    readiness = round(100 * sum(points[row["status"]] for row in matrix) / total)
    verdict = "BID READY - LOW RISK" if readiness >= 85 else "CONDITIONAL READINESS" if readiness >= 55 else "HIGH DISQUALIFICATION RISK"
    certificates = ["BIS licence (CM/L) copy where Scheme-I/QCO applies", "NABL-accredited test report dated within the last 12 months (or shorter tender validity)", "Mill Test Certificate / batch traceability where applicable", "Quality Assurance Plan (QAP)", "Declaration of conformity to applicable QCO and current standard edition"]
    vendor_checklist = [{"document": c, "stage": "Envelope A", "mandatory": True} for c in certificates]
    amendments = [
        {"section": "Section III — SCC", "text": f"The supplied {standard['title']} shall conform to {standard['is_code']} including applicable amendments in force on the bid closing date. The bidder shall identify the offered grade/model and certify traceability to each supplied lot."},
        {"section": "Section IV — Inspection/Testing", "text": "The purchaser may verify certificates and conduct sampling and testing at a laboratory accredited for the relevant method. Acceptance is subject to satisfactory reports; nonconforming lots may be rejected."},
        {"section": "Section II — ITB Rejection Criteria", "text": "Where compulsory certification applies, a valid BIS licence/registration covering the offered product and manufacturing location is a condition of responsiveness. Missing, expired, or out-of-scope evidence may render the offer non-responsive, subject to the tender and applicable law."},
    ]
    officer_view = {"vendor_checklist": vendor_checklist, "draft_tender_clauses": amendments,
                    "obsolete_code_checks": _obsolete_checks(text, standard)}
    contractor_view = {"bid_readiness_score": readiness, "verdict": verdict, "compliance_matrix": matrix,
                       "required_certificates": certificates,
                       "equivalent_suggestions": _equivalents(standard)}
    return {"officer_view": officer_view, "contractor_view": contractor_view, "compliance_matrix": matrix,
            "conformance_counts": {name: sum(1 for row in matrix if row["status"] == name) for name in ("Aligned", "Missing", "Deviated", "Partial")}}


def _relevant_excerpt(text: str, title: str) -> str:
    sentences = re.split(r"(?<=[.;\n])\s+", text.strip())
    terms = set(re.findall(r"[a-z]{4,}", title.lower()))
    ranked = sorted(((sum(1 for t in terms if t in s.lower()), s.strip()) for s in sentences), reverse=True)
    return ranked[0][1][:280] if ranked and ranked[0][0] else "No directly matching tender statement found."


def _obsolete_checks(text: str, standard: dict[str, Any]) -> list[dict[str, str]]:
    active_number = re.search(r"IS\s*(\d+)", standard["is_code"], re.I)
    checks = []
    for match in re.finditer(r"\bIS\s*(\d{3,5})\s*:\s*(\d{4})\b", text, re.I):
        code, year = match.group(1), match.group(2)
        if active_number and code == active_number.group(1) and year != standard["is_code"].split(":")[-1]:
            checks.append({"cited_code": match.group(0), "warning": f"Verify revision status: catalog reference is {standard['is_code']}; confirm supersession/amendments with BIS."})
    return checks


def _equivalents(standard: dict[str, Any]) -> list[dict[str, str]]:
    domain = standard["domain"]
    options = {
        "Civil & Construction": ["A higher grade may be offered only if design compatibility and purchaser approval are demonstrated."],
        "Electrical & Cables": ["An alternative insulation/conductor construction may be proposed only with equal or better rating, test evidence, and explicit purchaser approval."],
        "Mechanical & HVAC": ["A technically superior efficiency or duty point may be offered with independent performance evidence and confirmation of interface compatibility."],
        "Electronics & IT": ["An alternate model may be offered only with matching safety scope, current registration where required, and complete model-specific test evidence."],
        "Textiles & PPE": ["Equivalent or enhanced PPE may be offered only when certified performance covers every identified workplace hazard and fit requirement."],
    }
    return [{"suggestion": options.get(domain, ["Submit an equivalent only with test evidence and purchaser approval."])[0],
             "technical_justification": "Equivalence is conditional on matching the applicable edition, intended use, interfaces and performance tests; this tool does not pre-approve substitutions.",
             "commercial_advantage": "Offers a documented route to compare lifecycle cost and availability without waiving safety or procurement requirements."}]
