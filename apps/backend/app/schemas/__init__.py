"""Request and response Pydantic schemas for DocMind AI."""

from app.schemas.auth import (
    UserRegisterSchema,
    UserLoginSchema,
    TokenSchema,
    UserResponseSchema,
    ForgotPasswordSchema,
    GoogleLoginSchema,
)
from app.schemas.chat import (
    CreateThreadRequest,
    UpdateThreadRequest,
    ChatQueryRequest,
    ChatMessageResponse,
    ThreadResponse,
)
from app.schemas.documents import (
    DocumentMeta,
    DocumentUploadResponse,
    DocumentStatusResponse,
    DocumentListItem,
)

__all__ = [
    "UserRegisterSchema",
    "UserLoginSchema",
    "TokenSchema",
    "UserResponseSchema",
    "ForgotPasswordSchema",
    "GoogleLoginSchema",
    "CreateThreadRequest",
    "UpdateThreadRequest",
    "ChatQueryRequest",
    "ChatMessageResponse",
    "ThreadResponse",
    "DocumentMeta",
    "DocumentUploadResponse",
    "DocumentStatusResponse",
    "DocumentListItem",
]
