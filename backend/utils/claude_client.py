"""utils/claude_client.py — Anthropic SDK wrapper with retry + structured logging"""
# Aloha from Pearl City! 🌺

import json
import logging
import time
from typing import Any

import anthropic
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)

from backend.config import settings

logger = logging.getLogger("autorepairiq.claude")

_client: anthropic.AsyncAnthropic | None = None


def get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        if not settings.anthropic_api_key:
            raise RuntimeError("ANTHROPIC_API_KEY not configured")
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


@retry(
    retry=retry_if_exception_type((anthropic.RateLimitError, anthropic.APIConnectionError, anthropic.InternalServerError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=16),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
async def call_claude(
    *,
    system: str,
    messages: list[dict[str, Any]],
    model: str = "claude-sonnet-4-6",
    max_tokens: int = 1024,
) -> str:
    """Call Claude and return first text block. Retries on transient errors."""
    client = get_client()
    t0 = time.perf_counter()
    req_id = f"req_{int(t0 * 1000) % 99999:05d}"

    logger.info(json.dumps({"event": "claude_request", "req_id": req_id, "model": model}))

    response = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=messages,
    )

    latency_ms = round((time.perf_counter() - t0) * 1000)
    logger.info(json.dumps({
        "event": "claude_ok", "req_id": req_id, "latency_ms": latency_ms,
        "stop_reason": response.stop_reason,
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
    }))

    for block in response.content:
        if block.type == "text":
            return block.text

    raise ValueError("Claude returned no text content block")
