import re
from app.rag.query.models import QueryAnalysis

class QueryUnderstandingEngine:
    """
    Responsible for understanding, normalizing, and classifying user queries.
    """

    INTENT_KEYWORDS = {
        "SUMMARY": [
            "summary",
            "summarize",
            "overview",
            "brief",
            "gist"
        ],
        "DEFINITION": [
            "what is",
            "define",
            "meaning",
            "explain"
        ],
        "COMPARISON": [
            "compare",
            "difference",
            "versus",
            "vs"
        ],
        "LOCATION": [
            "where",
            "location",
            "centre",
            "center",
            "venue"
        ],
        "TIMELINE": [
            "when",
            "date",
            "time",
            "deadline"
        ],
        "CITATION": [
            "which page",
            "page number",
            "page"
        ],
        "LIST": [
            "list",
            "show all",
            "display all"
        ]
    }

    def understand(self, query: str) -> QueryAnalysis:
        """Main entry point for query analysis."""
        cleaned_query = self._clean_query(query)
        intent = self._detect_intent(cleaned_query)
        entities = self._extract_entities(query)
        rewritten = self._rewrite_query(cleaned_query)
        strategy = self._choose_strategy(intent)
        needs_llm = self._needs_llm(intent)

        return QueryAnalysis(
            original_query=query,
            intent=intent,
            rewritten_query=rewritten or cleaned_query,
            entities=entities,
            confidence=0.9 if intent != "GENERAL" else 0.7,
            retrieval_strategy=strategy,
            needs_llm=needs_llm,
            needs_conversation=False
        )

    def _clean_query(self, query: str) -> str:
        """Normalize the user query."""
        query = query.lower().strip()
        query = re.sub(r"\s+", " ", query)
        query = re.sub(r"[^\w\s]", "", query)
        return query

    def _detect_intent(self, query: str) -> str:
        """Detect the user's intent based on keyword heuristics."""
        for intent, keywords in self.INTENT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in query:
                    return intent
        return "GENERAL"

    def _extract_entities(self, query: str) -> list[str]:
        """Extract domain entities or quoted terms from query."""
        quoted = re.findall(r'"([^"]+)"', query)
        if quoted:
            return quoted
        capitalized = [word for word in query.split() if word.istitle() and len(word) > 2]
        return capitalized

    def _rewrite_query(self, query: str) -> str:
        """Synthesize improved retrieval query by stripping conversational prefix."""
        filler_patterns = [
            r"^(please\s+)?(tell\s+me|can\s+you\s+explain|what\s+is|what\s+are|how\s+to|give\s+me)\s+",
        ]
        rewritten = query
        for pattern in filler_patterns:
            rewritten = re.sub(pattern, "", rewritten, flags=re.IGNORECASE).strip()
        return rewritten or query

    def _choose_strategy(self, intent: str) -> str:
        """Select appropriate retrieval strategy based on intent."""
        strategy_map = {
            "SUMMARY": "EXHAUSTIVE",
            "CITATION": "EXACT_MATCH",
            "DEFINITION": "SEMANTIC",
            "COMPARISON": "HYBRID",
            "LOCATION": "HYBRID",
            "TIMELINE": "HYBRID",
            "LIST": "EXHAUSTIVE",
        }
        return strategy_map.get(intent, "DEFAULT")

    def _needs_llm(self, intent: str) -> bool:
        """Determine whether query requires LLM generation."""
        # Non-empty queries in DocMind RAG workflow generally route through LLM synthesis
        return True

query_understanding_engine = QueryUnderstandingEngine()
