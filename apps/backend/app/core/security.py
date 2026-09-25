from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Any
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# CryptContext configured with pbkdf2_sha256 and bcrypt algorithms
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against a stored hashed password safely."""
    try:
        safe_pass = str(plain_password)[:72]
        return pwd_context.verify(safe_pass, hashed_password)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Generate secure hash of a password."""
    safe_pass = str(password)[:72]
    return pwd_context.hash(safe_pass)

def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT access token with expiration time."""
    now_utc = datetime.now(timezone.utc)
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

import time
from collections import defaultdict
from threading import Lock
from fastapi import Request, HTTPException, status

class InMemoryRateLimiter:
    """Thread-safe, sliding-window in-process rate limiter for authentication endpoints.
    
    LIMITATION & ARCHITECTURAL SCOPE:
    This in-memory rate limiter tracks request timestamps per client IP in process memory.
    It is strictly designed for single-process deployments (such as default local or single-container runs).
    For horizontally scaled, multi-worker deployments (e.g., Gunicorn with multiple Uvicorn workers,
    Kubernetes pods), a distributed rate limiter backed by Redis or an API Gateway (Cloudflare, Nginx)
    must be utilized.
    """

    def __init__(self, requests_per_minute: int = 10, window_seconds: int = 60):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = window_seconds
        self._records = defaultdict(list)
        self._lock = Lock()

    @staticmethod
    def resolve_client_ip(request: Request) -> str:
        """Resolve client IP safely based on trusted proxy configuration.
        
        Security Model:
        - When settings.TRUST_PROXY_HEADERS is False (default for direct exposure):
          The IP is extracted strictly from the direct TCP socket connection (request.client.host).
          Untrusted incoming X-Forwarded-For headers are ignored to prevent header spoofing.
        - When settings.TRUST_PROXY_HEADERS is True (behind trusted reverse proxy):
          The originating IP is extracted from X-Forwarded-For (first entry) or X-Real-IP,
          falling back to request.client.host if headers are absent.
        """
        from app.core.config import settings

        peer_ip = request.client.host if request.client else "127.0.0.1"

        if not settings.TRUST_PROXY_HEADERS:
            return peer_ip

        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
            if client_ip:
                return client_ip

        real_ip = request.headers.get("x-real-ip")
        if real_ip and real_ip.strip():
            return real_ip.strip()

        return peer_ip

    def check_rate_limit(self, request: Request, client_key: Optional[str] = None) -> None:
        """Evaluate client request timestamp window and raise HTTP 429 if exceeded."""
        key = client_key or self.resolve_client_ip(request)
        now = time.time()

        with self._lock:
            # Retain only timestamps within the current sliding window
            timestamps = [ts for ts in self._records[key] if now - ts < self.window_seconds]
            if len(timestamps) >= self.requests_per_minute:
                retry_after = int(self.window_seconds - (now - timestamps[0])) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many authentication requests. Please try again later.",
                    headers={"Retry-After": str(max(1, retry_after))}
                )
            timestamps.append(now)
            self._records[key] = timestamps

    def reset(self) -> None:
        """Reset internal records (for test isolation)."""
        with self._lock:
            self._records.clear()

# Global rate limiters (10 requests/minute per client IP for auth abuse mitigation)
login_rate_limiter = InMemoryRateLimiter(requests_per_minute=10, window_seconds=60)
register_rate_limiter = InMemoryRateLimiter(requests_per_minute=10, window_seconds=60)

