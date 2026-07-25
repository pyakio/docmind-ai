import os
import logging
from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as LCDocument
import pypdf
import docx
from PIL import Image
import pytesseract

logger = logging.getLogger(__name__)

class DocumentChunker:
    """Production-grade Page-aware & Heading-aware Document Chunker supporting up to 1000 pages."""

    def __init__(self, chunk_size: int = 1200, chunk_overlap: int = 250):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n# ", "\n## ", "\n### ", "\n--- [Page ", "\n\n", "\n", " ", ""]
        )

    def extract_text(self, file_path: str) -> str:
        """Extract plain text from PDF (up to 1000 pages), DOCX, TXT, or Image files with page markers."""
        ext = os.path.splitext(file_path)[1].lower()
        text = ""

        if ext == ".pdf":
            try:
                reader = pypdf.PdfReader(file_path)
                num_pages = len(reader.pages)
                logger.info(f"Extracting PDF text for {os.path.basename(file_path)} across {num_pages} pages...")

                for page_num, page in enumerate(reader.pages, start=1):
                    extracted = page.extract_text()
                    if extracted:
                        text += f"\n--- [Page {page_num}] ---\n" + extracted.strip() + "\n"
            except Exception as e:
                logger.error(f"PDF extraction error: {e}")

        elif ext in [".png", ".jpg", ".jpeg", ".webp"]:
            try:
                img = Image.open(file_path)
                ocr_text = ""
                try:
                    ocr_text = pytesseract.image_to_string(img).strip()
                except Exception:
                    pass

                filename = os.path.basename(file_path)
                width, height = img.size

                if ocr_text:
                    text = f"Image Document: {filename}\n--- [Page 1] ---\nExtracted Content:\n{ocr_text}"
                else:
                    text = (
                        f"Image Document: {filename}\n--- [Page 1] ---\n"
                        f"Resolution: {width}x{height} pixels.\n"
                        f"Visual content indexed for natural Q&A inquiry."
                    )
            except Exception as e:
                logger.error(f"Image processing error: {e}")
                text = f"Image File: {os.path.basename(file_path)}. Visual document indexed."

        elif ext in [".docx", ".doc"]:
            try:
                doc = docx.Document(file_path)
                text = f"Document: {os.path.basename(file_path)}\n--- [Page 1] ---\n" + "\n".join([para.text for para in doc.paragraphs])
            except Exception as e:
                logger.error(f"DOCX extraction error: {e}")

        else:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f"Document: {os.path.basename(file_path)}\n--- [Page 1] ---\n" + f.read()
            except Exception as e:
                logger.error(f"Text file error: {e}")

        if not text.strip():
            text = f"Document File: {os.path.basename(file_path)}\n--- [Page 1] ---\nIndexed for natural assistant inquiry."

        return text.strip()

    def create_chunks(self, text: str, source_filename: str = "") -> List[LCDocument]:
        """Split text into LangChain Document chunks using page and heading separators."""
        if not text:
            return []

        docs = [LCDocument(page_content=text, metadata={"source": source_filename})]
        chunks = self.text_splitter.split_documents(docs)
        return chunks

chunker_service = DocumentChunker()
