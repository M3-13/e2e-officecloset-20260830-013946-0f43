import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request


class RateLimit:
    """IP-based fixed-window rate limiter, usable directly as a FastAPI dependency.

    Each instance keeps its own per-client bucket, so register and login can be
    limited independently of each other.
    """

    def __init__(self, max_requests: int = 5, window_seconds: int = 60) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._timestamps: defaultdict[str, deque[float]] = defaultdict(deque)

    def reset(self) -> None:
        self._timestamps.clear()

    @staticmethod
    def _client_ip(request: Request) -> str:
        if request.client is not None:
            return request.client.host
        return "unknown"

    def __call__(self, request: Request) -> None:
        ip = self._client_ip(request)
        now = time.monotonic()
        stamps = self._timestamps[ip]
        while stamps and now - stamps[0] >= self.window_seconds:
            stamps.popleft()
        if len(stamps) >= self.max_requests:
            raise HTTPException(
                status_code=429,
                detail="Too many requests, please try again in a minute.",
            )
        stamps.append(now)
