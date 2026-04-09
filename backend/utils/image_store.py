"""utils/image_store.py — save/load images, validate type/size"""
# Aloha from Pearl City! 🌺

import base64
import io
import uuid
from pathlib import Path

from PIL import Image

from backend.config import settings

UPLOAD_DIR = Path(settings.image_upload_dir)
MAX_SIZE_BYTES = settings.max_image_size_mb * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_DIMENSION = 4096


def ensure_upload_dir() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


async def save_upload(file_bytes: bytes, content_type: str) -> tuple[str, float]:
    """Validate, optionally resize, save. Returns (filename, size_kb)."""
    if content_type not in ALLOWED_TYPES:
        raise ValueError(f"Unsupported image type: {content_type}")
    if len(file_bytes) > MAX_SIZE_BYTES:
        raise ValueError(f"Image too large: {len(file_bytes) / 1024 / 1024:.1f} MB")

    img = Image.open(io.BytesIO(file_bytes))
    if max(img.size) > MAX_DIMENSION:
        img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)
    if img.mode in ("RGBA", "P") and content_type == "image/jpeg":
        img = img.convert("RGB")

    ext_map = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    ext = ext_map.get(content_type, ".jpg")
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename

    save_kwargs: dict = {}
    if content_type == "image/jpeg":
        save_kwargs = {"format": "JPEG", "quality": 88, "optimize": True}
    elif content_type == "image/png":
        save_kwargs = {"format": "PNG", "optimize": True}
    elif content_type == "image/webp":
        save_kwargs = {"format": "WEBP", "quality": 88}

    img.save(str(filepath), **save_kwargs)
    size_kb = filepath.stat().st_size / 1024
    return filename, round(size_kb, 1)


def load_image_base64(filename: str) -> tuple[str, str]:
    """Load saved image as (base64_data, media_type)."""
    safe_name = Path(filename).name
    filepath = UPLOAD_DIR / safe_name
    if not filepath.exists():
        raise FileNotFoundError(f"Image not found: {safe_name}")

    ext_to_mime = {".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                   ".png": "image/png", ".webp": "image/webp"}
    media_type = ext_to_mime.get(filepath.suffix.lower(), "image/jpeg")
    data = filepath.read_bytes()
    return base64.b64encode(data).decode(), media_type
