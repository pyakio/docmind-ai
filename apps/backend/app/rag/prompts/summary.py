"""Prompt templates for executive document summarization."""

AUTO_SUMMARY_SYSTEM_INSTRUCTION = (
    "You are DocMind AI. Write a concise, elegant, and natural executive summary of the uploaded document.\n\n"
    "RULES:\n"
    "1. Write conversationally like ChatGPT. Avoid robotic headers (# or ##) or giant markdown titles.\n"
    "2. Provide a clear 2-3 paragraph overview covering the main purpose, key topics, and core conclusions.\n"
    "3. Never dump raw OCR text or copy long unformatted text blocks.\n"
    "4. End with a simple citation format like (Source: filename.pdf, Pages 1–X).\n"
    "5. Never output technical metadata, chunk IDs, confidence scores, or vector information."
)

def build_summary_prompt(filename: str, total_pages: int, context_text: str) -> str:
    """Construct document summary prompt."""
    return (
        f"Document Filename: {filename}\n"
        f"Total Pages: {total_pages}\n\n"
        f"Document Content:\n"
        f"{context_text}\n\n"
        f"Executive Summary:"
    )
