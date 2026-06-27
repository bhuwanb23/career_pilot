import logging

logger = logging.getLogger(__name__)


async def extract_document(file_content: bytes, filename: str = "") -> dict:
    try:
        return await _extract_with_mineru(file_content, filename)
    except ImportError:
        logger.debug("MinerU not installed, falling back to PyMuPDF")
        return _extract_with_pymupdf(file_content)
    except Exception:
        logger.warning("MinerU extraction failed, falling back to PyMuPDF", exc_info=True)
        return _extract_with_pymupdf(file_content)


async def _extract_with_mineru(file_content: bytes, filename: str) -> dict:
    import tempfile
    import os
    from pathlib import Path

    suffix = Path(filename).suffix if filename else ".pdf"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name

    try:
        from mineru.cli.common import do_parse
        output_dir = tempfile.mkdtemp()
        do_parse(tmp_path, output_dir=output_dir, result_type="markdown")
        md_file = Path(output_dir) / Path(tmp_path).stem / "auto" / f"{Path(tmp_path).stem}.md"
        if md_file.exists():
            text = md_file.read_text(encoding="utf-8")
        else:
            text = _extract_with_pymupdf(file_content)["text"]
        return {"text": text, "pages": 0, "metadata": {}, "engine": "mineru"}
    finally:
        os.unlink(tmp_path)


def _extract_with_pymupdf(file_content: bytes) -> dict:
    import fitz
    doc = fitz.open(stream=file_content, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    pages = len(doc)
    doc.close()
    return {"text": text.strip(), "pages": pages, "metadata": {}, "engine": "pymupdf"}
