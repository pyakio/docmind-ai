"""Centralized AI prompt templates and prompt builder for DocMind AI."""

from app.rag.prompts.system import DOCMIND_SYSTEM_INSTRUCTION
from app.rag.prompts.summary import AUTO_SUMMARY_SYSTEM_INSTRUCTION, build_summary_prompt
from app.rag.prompts.qa import build_qa_prompt
from app.rag.prompts.ocr import build_ocr_image_header, build_ocr_visual_header
from app.rag.prompts.builder import PromptBuilder, prompt_builder_service

__all__ = [
    "DOCMIND_SYSTEM_INSTRUCTION",
    "AUTO_SUMMARY_SYSTEM_INSTRUCTION",
    "build_summary_prompt",
    "build_qa_prompt",
    "build_ocr_image_header",
    "build_ocr_visual_header",
    "PromptBuilder",
    "prompt_builder_service",
]
