import json
import uuid
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image
from starlette.types import ASGIApp, Receive, Scope, Send

from .config import get_settings

MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
UPLOAD_PATH = "/api/wardrobe/items"

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


class InvalidImageError(Exception):
    """Raised when an uploaded image is corrupt or uses an unsupported format."""


def get_upload_dir() -> Path:
    upload_dir = Path(get_settings().upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def _resolve_upload_path(filename: str) -> Path:
    upload_dir = get_upload_dir().resolve()
    candidate = (upload_dir / filename).resolve()
    if candidate.parent != upload_dir:
        raise HTTPException(status_code=404, detail="Datei nicht gefunden")
    return candidate


def _sanitize_image(data: bytes) -> tuple[bytes, str]:
    """Validate the image format and strip EXIF metadata; returns (bytes, extension)."""
    try:
        img = Image.open(BytesIO(data))
        fmt = img.format
        if fmt not in ALLOWED_FORMATS:
            img.close()
            raise InvalidImageError("Ungültiges Bildformat")
        img.load()
        if fmt == "JPEG" and img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        output = BytesIO()
        img.save(output, format=fmt)
        img.close()
        return output.getvalue(), fmt.lower()
    except InvalidImageError:
        raise
    except Exception as exc:
        raise InvalidImageError("Bild konnte nicht gelesen werden") from exc


def save_image(upload_file: UploadFile) -> str:
    """Persist an uploaded image under UPLOAD_DIR and return its stored filename."""
    data = upload_file.file.read(MAX_UPLOAD_SIZE_BYTES + 1)
    if len(data) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Bild ist zu groß (max. 5 MB).")
    try:
        sanitized, extension = _sanitize_image(data)
    except InvalidImageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    filename = f"{uuid.uuid4().hex}.{extension}"
    (get_upload_dir() / filename).write_bytes(sanitized)
    return filename


def delete_image(filename: str) -> None:
    """Delete a stored image file, ignoring files that do not exist."""
    upload_dir = get_upload_dir().resolve()
    candidate = (upload_dir / filename).resolve()
    if candidate.parent != upload_dir:
        return
    candidate.unlink(missing_ok=True)


@router.get("/{filename}")
def serve_upload(filename: str) -> FileResponse:
    path = _resolve_upload_path(filename)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Datei nicht gefunden")
    return FileResponse(path)


class UploadSizeLimitMiddleware:
    """Reject oversized uploads from the Content-Length header before the body is read."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if (
            scope["type"] == "http"
            and scope.get("method") == "POST"
            and scope.get("path") == UPLOAD_PATH
        ):
            raw = dict(scope.get("headers") or []).get(b"content-length")
            if raw is not None:
                try:
                    content_length = int(raw.decode("ascii"))
                except (ValueError, UnicodeDecodeError):
                    content_length = 0
                if content_length > MAX_UPLOAD_SIZE_BYTES:
                    await self._send_413(send)
                    return
        await self.app(scope, receive, send)

    @staticmethod
    async def _send_413(send: Send) -> None:
        body = json.dumps({"detail": "Bild ist zu groß (max. 5 MB)."}).encode("utf-8")
        await send(
            {
                "type": "http.response.start",
                "status": 413,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(body)).encode("ascii")),
                ],
            }
        )
        await send({"type": "http.response.body", "body": body})
