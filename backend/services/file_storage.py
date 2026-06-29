import hashlib
import logging
from pathlib import Path

from config import BASE_DIR

logger = logging.getLogger(__name__)

UPLOAD_DIR = BASE_DIR / "data" / "uploads"


def store_file(filename: str, content: bytes) -> str:
    file_hash = hashlib.sha256(content).hexdigest()[:16]
    ext = Path(filename).suffix.lower()
    safe_name = f"{file_hash}{ext}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filepath = UPLOAD_DIR / safe_name
    filepath.write_bytes(content)
    logger.info("Stored file: %s (%d bytes)", safe_name, len(content))
    return f"uploads/{safe_name}"


def get_stored_file(relative_path: str) -> bytes | None:
    filepath = BASE_DIR / "data" / relative_path
    if filepath.exists():
        return filepath.read_bytes()
    return None


def delete_stored_file(relative_path: str) -> bool:
    filepath = BASE_DIR / "data" / relative_path
    if filepath.exists():
        filepath.unlink()
        logger.info("Deleted file: %s", relative_path)
        return True
    return False


def compute_file_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()
