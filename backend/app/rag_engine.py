from __future__ import annotations
from typing import Any
from .compliance_checker import check_compliance, extract_parameters
from .vector_store import HybridVectorStore


class RAGEngine:
    def __init__(self, standards: list[dict[str, Any]]):
        self.standards = standards
        self.store = HybridVectorStore(standards)

    def analyze(self, text: str, domain_filter: str | None = None, top_k: int = 5, role: str = "both") -> dict[str, Any]:
        matches = self.store.search(text, domain_filter, top_k)
        recommendations = []
        for hit in matches:
            standard = hit["standard"]
            compliance = check_compliance(text, standard)
            recommendations.append({**hit, **compliance})
        selected = recommendations[0] if recommendations else None
        result = {"extracted_parameters": extract_parameters(text), "recommendations": recommendations,
                  "primary_recommendation": selected,
                  "notice": "Automated screening aid only. Validate standards editions, QCO applicability, clauses, and acceptance decisions against official documents and competent engineering/legal review."}
        # Both views are always returned to keep the API useful to integrations; role is a presentation preference.
        if selected:
            result["officer_view"] = selected["officer_view"]
            result["contractor_view"] = selected["contractor_view"]
        else:
            result["officer_view"] = {"vendor_checklist": [], "draft_tender_clauses": [], "obsolete_code_checks": []}
            result["contractor_view"] = {"bid_readiness_score": 0, "verdict": "HIGH DISQUALIFICATION RISK", "compliance_matrix": [], "required_certificates": [], "equivalent_suggestions": []}
        result["requested_role"] = role
        return result
