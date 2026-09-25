from dataclasses import dataclass, field
from typing import List

@dataclass
class QueryAnalysis:
    """
    Structured representation of a user's query.
    This object is passed between services instead of sending raw strings.
    """
    original_query: str
    intent: str
    rewritten_query: str
    entities: List[str] = field(default_factory=list)
    confidence: float = 1.0
    retrieval_strategy: str = "DEFAULT"
    needs_llm: bool = False
    needs_conversation: bool = False
