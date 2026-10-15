# M87 Public Information AI Navigator: Superseded Scope and Evaluation Record

## Status

**M5 has been superseded as an active project deliverable by the M89 announcement QR share kit.** The 32-case multilingual blind evaluation did not complete against the configured Gemini API, so M5 was not passed. Under the revised project scope, M5 is no longer a required exit gate; the Navigator remains disabled by default and is not represented as production-ready.

## Observed provider constraint

The user-provided synthetic-run output showed provider timeouts, HTTP 429 rate limiting, and HTTP 503 service errors. A Google AI Studio one-prompt smoke test returned quickly, but that did not verify the Django backend integration or complete the M5 corpus. Repeatedly increasing the run-only timeout did not produce a completed 32-case result.

These results show that the currently available provider project/quota and observed response latency were not sufficient for the planned evaluation run. They do not establish that Gemini is universally unavailable or that the navigator code is correct or incorrect.

## Impact

- Factual grounding, citation quality, multilingual response quality, provider-failure handling across all cases, and the original M5 thresholds remain unverified by the required blind human evaluation.
- Provider-backed chat remains an experimental capability and stays disabled by default (`PUBLIC_NAVIGATOR_ENABLED=False`).
- No resident service should depend on a successful Gemini response for essential public information.
- A future decision to resume the Navigator would require a separately approved scope and evaluation plan. Previous failed runs are not evidence of a pass.

## Related platform gate

The original AC-18 automated Facebook publishing path has been **replaced in the active scope with administrator-managed manual posting**. Admins use the official Page, apply its available comment controls before posting, and use other official channels when the Page cannot disable comments. KapitBayan adds no Meta publishing API, Page-token storage, or comment ingestion. The original programmatic comment-disabling feasibility gate was not passed; it is retired from the revised scope rather than claimed as technically satisfied.

## Project direction

The cross-channel announcement QR share kit is the selected emerging-technology deliverable. It is a deterministic distribution aid built on KapitBayan's existing public announcement records and does not depend on generative AI, external model quotas, a vector database, or Meta Page tokens. M5's failed evaluation history remains recorded above, while the QR share kit replaces M5 in the active project scope.
