import os
import re
import time
import pypdf
import docx
from PIL import Image
import pytesseract
from app.rag.prompts.ocr import build_ocr_image_header, build_ocr_visual_header
from app.core.logging import get_logger

logger = get_logger(__name__)

class DocumentParser:
    """Production-grade Document Parser and OCR Extractor.
    
    Supports PDF (up to 1000 pages), DOCX, TXT, and OCR for images (PNG, JPG, WEBP).
    Emits structured text with page boundaries (--- [Page N] ---).
    """

    def extract_text(self, file_path: str) -> str:
        """Extract plain text with clean page markers."""
        if not file_path or not os.path.exists(file_path):
            logger.error(f"[Parser] File path does not exist: '{file_path}'")
            return ""

        ext = os.path.splitext(file_path)[1].lower()
        start_time = time.time()
        raw_text = ""
        page_count = 1

        try:
            if ext == ".pdf":
                reader = pypdf.PdfReader(file_path)
                page_count = len(reader.pages)
                max_pages = 1000
                if page_count > max_pages:
                    logger.warning(
                        f"[Parser] PDF '{os.path.basename(file_path)}' has {page_count} pages; capping extraction at {max_pages} pages."
                    )
                logger.info(f"[Parser] Extracting PDF '{os.path.basename(file_path)}' across {min(page_count, max_pages)} page(s)...")

                extracted_pages = []
                for page_num, page in enumerate(reader.pages[:max_pages], start=1):
                    p_text = page.extract_text() or ""
                    clean_p = self.clean_page_text(p_text)
                    if clean_p:
                        extracted_pages.append(f"\n--- [Page {page_num}] ---\n{clean_p}")

                raw_text = "\n".join(extracted_pages)

            elif ext in [".png", ".jpg", ".jpeg", ".webp"]:
                ocr_text = ""
                with Image.open(file_path) as img:
                    width, height = img.size
                    try:
                        ocr_text = pytesseract.image_to_string(img).strip()
                    except Exception as ocr_err:
                        logger.debug(f"[Parser] OCR fallback notice for '{file_path}': {ocr_err}")

                filename = os.path.basename(file_path)
                if ocr_text:
                    clean_ocr = self.clean_page_text(ocr_text)
                    raw_text = build_ocr_image_header(filename, clean_ocr)
                else:
                    raw_text = build_ocr_visual_header(filename, width, height)

            elif ext in [".docx", ".doc"]:
                doc = docx.Document(file_path)
                paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
                clean_doc_text = self.clean_page_text("\n\n".join(paragraphs))
                raw_text = f"Document: {os.path.basename(file_path)}\n--- [Page 1] ---\n{clean_doc_text}"

            else:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    clean_txt = self.clean_page_text(f.read())
                    raw_text = f"Document: {os.path.basename(file_path)}\n--- [Page 1] ---\n{clean_txt}"

            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            logger.info(
                f"\n========================\n"
                f"TEXT EXTRACTION\n"
                f"Characters extracted: {len(raw_text)}\n"
                f"Pages detected: {page_count}\n"
                f"Extraction time: {elapsed_ms}ms\n"
                f"========================"
            )
            return raw_text.strip()

        except Exception as e:
            logger.error(f"[Parser] Error extracting text from '{file_path}': {e}", exc_info=True)
            return ""

    def clean_page_text(self, text: str) -> str:
        """OCR cleanup & text normalization: removes headers/footers and fixes line breaks."""
        if not text:
            return ""

        # Remove repetitive header/footer page count patterns (e.g. "Page 1 of 12")
        cleaned = re.sub(r"(?i)page\s+\d+\s+of\s+\d+", "", text)
        
        # Consolidate multiple spaces and blank lines
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        
        # Fix broken hyphenated line breaks from OCR (e.g. "com-\nmunication")
        cleaned = re.sub(r"(\w+)-\n(\w+)", r"\1\2", cleaned)

        return cleaned.strip()

document_parser = DocumentParser()
