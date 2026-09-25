"""Prompt templates for RAG Q&A chat synthesis."""

def build_qa_prompt(filename: str, compressed_context: str, user_query: str, page_citation: str = "") -> str:
    """Construct document RAG Q&A prompt."""
    citation_hint = f" ({page_citation})" if page_citation else ""
    return (
        f"Attached Document: {filename}{citation_hint}\n\n"
        f"Relevant Document Context:\n"
        f"{compressed_context}\n\n"
        f"User Question: {user_query}\n\n"
        f"Answer:"
    )
