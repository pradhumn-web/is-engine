from __future__ import annotations

import math
import re
from collections import Counter
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

TOKEN = re.compile(r"[a-z0-9]+(?:[.-][a-z0-9]+)*", re.I)


def _tokens(text: str) -> list[str]:
    return [t.lower() for t in TOKEN.findall(text)]


def _composite(s: dict[str, Any]) -> str:
    clauses = " ".join(f"{c.get('title','')} {c.get('requirement','')}" for c in s.get("mandatory_clauses", []))
    return " ".join([s.get("is_code", ""), s.get("title", ""), s.get("domain", ""), s.get("scope", ""), " ".join(s.get("keywords", [])), clauses])


class BM25Index:
    def __init__(self, documents: list[str], k1: float = 1.5, b: float = 0.75):
        self.k1, self.b = k1, b
        self.docs = [_tokens(d) for d in documents]
        self.doc_lengths = [len(d) for d in self.docs]
        self.avgdl = sum(self.doc_lengths) / max(1, len(self.doc_lengths))
        self.df = Counter(term for doc in self.docs for term in set(doc))
        self.n = len(self.docs)

    def scores(self, query: str) -> list[float]:
        qterms = set(_tokens(query))
        values = []
        for doc, dl in zip(self.docs, self.doc_lengths):
            tf = Counter(doc)
            score = 0.0
            for term in qterms:
                f = tf.get(term, 0)
                if not f:
                    continue
                # Robertson-Spärck Jones IDF (positive variant).
                idf = math.log1p((self.n - self.df[term] + 0.5) / (self.df[term] + 0.5))
                denom = f + self.k1 * (1 - self.b + self.b * dl / max(1.0, self.avgdl))
                score += idf * f * (self.k1 + 1) / denom
            values.append(score)
        return values


class HybridVectorStore:
    def __init__(self, standards: list[dict[str, Any]]):
        if not standards:
            raise ValueError("The standards corpus is empty")
        self.standards = standards
        self.documents = [_composite(s) for s in standards]
        self.bm25 = BM25Index(self.documents)
        self.vectorizer = TfidfVectorizer(sublinear_tf=True, ngram_range=(1, 3), max_features=5000, stop_words="english")
        self.matrix = self.vectorizer.fit_transform(self.documents)

    @staticmethod
    def _exact_boost(query: str, standard: dict[str, Any]) -> float:
        q = query.lower()
        boost = 0.0
        code_digits = re.sub(r"[^a-z0-9]", "", standard.get("is_code", "").lower())
        if standard.get("is_code", "").lower() in q or (code_digits and code_digits in re.sub(r"[^a-z0-9]", "", q)):
            boost += 0.65
        patterns = [r"fe\s*500\s*d", r"e\s*250", r"\b1100\s*v\b", r"\b1\.1\s*kv\b", r"\b1\.5\s*tr\b"]
        std = _composite(standard).lower()
        for pattern in patterns:
            if re.search(pattern, q) and re.search(pattern, std):
                boost += 0.16
        return min(1.0, boost)

    def search(self, query: str, domain_filter: str | None = None, top_k: int = 5) -> list[dict[str, Any]]:
        query = query.strip()
        if not query:
            return []
        qvec = self.vectorizer.transform([query])
        semantic = cosine_similarity(qvec, self.matrix).ravel().tolist()
        bm = self.bm25.scores(query)
        max_bm = max(bm, default=0.0)
        bm_norm = [x / max_bm if max_bm else 0.0 for x in bm]
        results = []
        for idx, standard in enumerate(self.standards):
            if domain_filter and domain_filter.lower() not in standard["domain"].lower():
                continue
            exact = self._exact_boost(query, standard)
            # Keep the exact feature in the requested 0.20 channel while scaling to [0,1].
            score = 0.45 * semantic[idx] + 0.35 * bm_norm[idx] + 0.20 * exact
            confidence = round(min(100.0, max(0.0, score * 100)), 1)
            tier = "High" if confidence >= 35 else "Medium" if confidence >= 15 else "Low"
            results.append({"standard": standard, "confidence": confidence, "tier": tier,
                            "scores": {"semantic_cosine": round(semantic[idx], 4), "bm25": round(bm_norm[idx], 4), "exact_boost": round(exact, 4)}})
        results.sort(key=lambda item: (item["confidence"], item["standard"]["is_code"]), reverse=True)
        return results[:max(1, min(int(top_k), 20))]
