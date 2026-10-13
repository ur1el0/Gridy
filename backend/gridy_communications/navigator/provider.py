"""
Server-side Gemini LLM adapter for the Public Information AI Navigator.

Operates statelessly: does not store prompts, responses, or session keys.
API credentials stay strictly server-side and are transmitted via x-goog-api-key headers.
"""

import json
import logging
from typing import Dict, List, Optional
import requests
from django.conf import settings

from gridy_communications.navigator.prompt import build_navigator_prompt

logger = logging.getLogger(__name__)


class ProviderError(Exception):
    """Base exception for provider failures."""
    pass


class ProviderTimeoutError(ProviderError):
    """Raised when the provider request exceeds configured timeout."""
    pass


class ProviderNetworkError(ProviderError):
    """Raised on socket/transport connectivity failure."""
    pass


class ProviderQuotaError(ProviderError):
    """Raised when the provider returns HTTP 429 rate limit / quota exceeded."""
    pass


class ProviderMalformedOutputError(ProviderError):
    """Raised when the provider output fails JSON validation or schema compliance."""
    pass


DEFAULT_TIMEOUT_SECONDS = 8.0
MAX_TIMEOUT_SECONDS = 8.0


def clamp_timeout(val: Optional[float]) -> float:
    """
    Safely resolves and clamps the provider timeout.
    Enforces a default of 8.0s and an 8.0s hard maximum.
    Non-positive, null, or invalid values fall back safely to 8.0s.
    """
    if val is None:
        return DEFAULT_TIMEOUT_SECONDS
    try:
        val_float = float(val)
    except (ValueError, TypeError):
        return DEFAULT_TIMEOUT_SECONDS
    if val_float <= 0.0:
        return DEFAULT_TIMEOUT_SECONDS
    return min(val_float, MAX_TIMEOUT_SECONDS)


class GeminiNavigatorProvider:
    """
    Stateless adapter communicating with Google Gemini API via REST.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ):
        self.api_key = (
            api_key
            if api_key is not None
            else getattr(settings, "GEMINI_API_KEY", "")
        ).strip()
        self.model = (
            model
            if model is not None
            else getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")
        ).strip()
        raw_timeout = (
            timeout
            if timeout is not None
            else getattr(settings, "PUBLIC_NAVIGATOR_TIMEOUT_SECONDS", DEFAULT_TIMEOUT_SECONDS)
        )
        self.timeout = clamp_timeout(raw_timeout)
        self.max_tokens = (
            max_tokens
            if max_tokens is not None
            else getattr(settings, "PUBLIC_NAVIGATOR_MAX_OUTPUT_TOKENS", 800)
        )

    def is_configured(self) -> bool:
        """Returns True if a non-empty API key is available."""
        return bool(self.api_key)

    def generate_answer(self, query: str, sources: List[dict]) -> dict:
        """
        Sends the grounded query and sources to Gemini and returns structured output:
        {
            "status": "answered" | "abstained",
            "answer": str,
            "reason": Optional[str],
            "cited_sources": List[str]
        }
        """
        if not self.is_configured():
            raise ProviderError("Gemini API key is not configured.")

        prompt_text = build_navigator_prompt(query, sources)
        if prompt_text is None:
            logger.warning("Navigator prompt budget exceeded by rules and query.")
            return {
                "status": "abstained",
                "answer": (
                    "The inquiry exceeds allowable limits and cannot be processed safely. "
                    "Please ask a shorter question or contact the Barangay Hall directly."
                ),
                "reason": "prompt_budget_exceeded",
                "cited_sources": [],
            }

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
        }
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt_text}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": self.max_tokens,
                "responseMimeType": "application/json",
            },
        }

        try:
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=self.timeout,
            )
        except requests.Timeout as exc:
            logger.warning("Navigator Gemini request timed out after %s seconds.", self.timeout)
            raise ProviderTimeoutError("Gemini provider request timed out.") from exc
        except requests.RequestException as exc:
            logger.warning("Navigator Gemini request failed with network error: %s", type(exc).__name__)
            raise ProviderNetworkError(f"Gemini provider network error: {type(exc).__name__}") from exc

        if response.status_code == 429:
            logger.warning("Navigator Gemini request throttled by provider (HTTP 429).")
            raise ProviderQuotaError("Gemini quota or rate limit exceeded.")
        elif response.status_code != 200:
            logger.warning("Navigator Gemini request returned non-200 HTTP status: %s", response.status_code)
            raise ProviderError(f"Gemini request failed with HTTP {response.status_code}.")

        try:
            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise ValueError("No candidate completions returned by provider.")

            content_parts = candidates[0].get("content", {}).get("parts", [])
            if not content_parts or "text" not in content_parts[0]:
                raise ValueError("Candidate completion part missing text content.")

            raw_text = content_parts[0]["text"].strip()

            # Clean potential Markdown code fences if model output wrapped them
            if raw_text.startswith("```"):
                lines = raw_text.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw_text = "\n".join(lines).strip()

            parsed = json.loads(raw_text)
            if not isinstance(parsed, dict):
                raise ValueError("Model output JSON is not an object.")

            status = str(parsed.get("status", "")).strip().casefold()
            if status not in {"answered", "abstained"}:
                status = "abstained"

            answer = str(parsed.get("answer", "")).strip()
            reason = parsed.get("reason")
            cited_sources = parsed.get("cited_sources", [])
            if not isinstance(cited_sources, list):
                cited_sources = []

            return {
                "status": status,
                "answer": answer,
                "reason": str(reason) if reason else None,
                "cited_sources": [str(s) for s in cited_sources],
            }
        except Exception as exc:
            logger.warning("Failed to parse structured JSON from Gemini completion: %s", type(exc).__name__)
            raise ProviderMalformedOutputError("Malformed response structure from AI provider.") from exc


def get_navigator_provider() -> GeminiNavigatorProvider:
    """Factory helper returning a configured provider instance."""
    return GeminiNavigatorProvider()
