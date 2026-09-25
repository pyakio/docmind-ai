"""Instruction templates for OCR and image text parsing."""

def build_ocr_image_header(filename: str, clean_ocr_text: str) -> str:
    """Format OCR image text extraction content."""
    return f"Image Document: {filename}\n--- [Page 1] ---\n{clean_ocr_text}"

def build_ocr_visual_header(filename: str, width: int, height: int) -> str:
    """Format fallback visual image document header."""
    return (
        f"Image Document: {filename}\n--- [Page 1] ---\n"
        f"Resolution: {width}x{height} pixels.\n"
        f"Visual graphic document parsed for natural assistant inquiry."
    )
