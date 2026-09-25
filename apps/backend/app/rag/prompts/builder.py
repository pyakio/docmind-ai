from app.rag.prompts.system import DOCMIND_SYSTEM_INSTRUCTION
from app.rag.prompts.summary import AUTO_SUMMARY_SYSTEM_INSTRUCTION, build_summary_prompt
from app.rag.prompts.ocr import build_ocr_image_header, build_ocr_visual_header
from app.core.logging import get_logger

logger = get_logger(__name__)

class PromptBuilder:
    """Production-grade Prompt Assembly Engine for DocMind AI.
    
    Stateless builder responsible strictly for assembling clean, formatted AI prompt payloads.
    Decoupled from LLM calling, retrieval, OCR execution, and DB access.
    """

    @staticmethod
    def build_qa_prompt(
        query: str,
        compressed_context: str,
        filename: str = "document.pdf",
        citation: str = "",
        conversation_history: str = ""
    ) -> str:
        """Assemble document RAG Q&A prompt with optional conversation history."""
        parts = []
        if filename:
            citation_hint = f" ({citation})" if citation else ""
            parts.append(f"Attached Document: {filename}{citation_hint}")
        if compressed_context:
            parts.append(f"Relevant Document Context:\n<context>\n{compressed_context}\n</context>")
        if conversation_history:
            parts.append(f"Recent Conversation History:\n{conversation_history}")
        parts.append(f"User Question: {query}")
        parts.append("Answer:")

        prompt_text = "\n\n".join(parts)

        logger.info(
            f"\n========================\n"
            f"PROMPT BUILDER\n"
            f"Conversation History Length: {len(conversation_history)} chars\n"
            f"Prompt Size: {len(prompt_text)} chars\n"
            f"System Prompt: DocMind Assistant Style\n"
            f"========================"
        )

        return prompt_text

    @staticmethod
    def build_summary_prompt(
        filename: str,
        total_pages: int,
        compressed_context: str
    ) -> str:
        """Assemble document executive summary prompt."""
        return build_summary_prompt(filename, total_pages, compressed_context)

    @staticmethod
    def build_ocr_prompt(
        filename: str,
        ocr_text: str = "",
        width: int = 0,
        height: int = 0
    ) -> str:
        """Assemble OCR image context string."""
        if ocr_text:
            return build_ocr_image_header(filename, ocr_text)
        return build_ocr_visual_header(filename, width, height)

    @staticmethod
    def get_system_instruction(is_summary: bool = False) -> str:
        """Return system instruction string."""
        return AUTO_SUMMARY_SYSTEM_INSTRUCTION if is_summary else DOCMIND_SYSTEM_INSTRUCTION

prompt_builder_service = PromptBuilder()
