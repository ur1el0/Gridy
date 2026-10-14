"""
Deterministic pre-provider privacy and intent guard for the Public Information AI Navigator.

Enforces Data Privacy Act (RA 10173) compliance by rejecting private, sensitive,
or account-specific queries in-process before invoking any external AI provider.

While these heuristics intercept common personal probes, transaction receipts,
billing submissions, and sensitive identifiers, regex heuristics are not exhaustive for all PII.
The navigator adheres to defense-in-depth by combining pre-provider guards, passive source
containment, and non-persistence of user queries.
"""

import re
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class GuardResult:
    triggered: bool
    reason: Optional[str] = None
    message: Optional[str] = None


# These local details are not in the verified public source bundle. Never send
# questions about their current values to the external provider.
CLEARANCE_QUERY_RE = re.compile(r"\bclearances?\b", re.IGNORECASE)
CLEARANCE_FEE_QUERY_RE = re.compile(
    r"\b(?:how\s+much|magkano|pila|presyo|fee|fees|cost|price|charge|charges|"
    r"pay|paid|payment|bayad|libre|free)\b",
    re.IGNORECASE,
)
CLEARANCE_AMOUNT_QUERY_RE = re.compile(
    r"\b(?:how\s+much|magkano|pila|presyo|exact\s+amount|current\s+amount)\b|"
    r"\b(?:what(?:'s|\s+is)|how\s+much).{0,60}\b(?:cost|price|charge|amount)\b",
    re.IGNORECASE,
)
CLEARANCE_FEE_AMOUNT_QUESTION_RE = re.compile(
    r"\bwhat(?:'s|\s+is).{0,60}\b(?:fee|fees)\b", re.IGNORECASE
)
CLEARANCE_EXEMPTION_QUERY_RE = re.compile(
    r"\b(?:exempt(?:ion)?|waiver|free|libre)\b", re.IGNORECASE
)
FIRST_TIME_JOBSEEKER_RE = re.compile(
    r"\bfirst[\s-]+time\s+jobseekers?\b", re.IGNORECASE
)
ORDINARY_CLEARANCE_RE = re.compile(
    r"\b(?:ordinary|regular|personal|general|non[\s-]+employment|business|residency)\b",
    re.IGNORECASE,
)
HALL_HOURS_QUERY_RES = (
    re.compile(r"\b(?:barangay\s+)?hall\s+hours?\b", re.IGNORECASE),
    re.compile(r"\b(?:office|opening|operating)\s+hours?\b", re.IGNORECASE),
    re.compile(
        r"\b(?:what|when|at\s+what|anong)\b.{0,80}\b(?:time|oras)\b.{0,80}"
        r"\b(?:open|opens|close|closes|closing|bukas|sara|magsasara)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:open|opens|close|closes|closing|bukas|sara|magsasara)\b.{0,80}"
        r"\b(?:barangay\s+hall|hall|office|tanggapan|today|ngayon)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:oras|time)\b.{0,60}\b(?:barangay\s+hall|hall|office|tanggapan)\b",
        re.IGNORECASE,
    ),
)
INDIGENCY_QUERY_RE = re.compile(
    r"\b(?:certificate\s+of\s+indigency|indigency\s+certificate|indigency|"
    r"sertipiko\s+ng\s+indigency)\b",
    re.IGNORECASE,
)
LOCAL_FEE_QUERY_RE = re.compile(
    r"\b(?:fee|fees|cost|price|charge|charges|pay|paid|payment|bayad|magkano|"
    r"pila|presyo|libre|free)\b",
    re.IGNORECASE,
)


def check_unsupported_local_query(query: str) -> GuardResult:
    """Abstain before source retrieval/provider calls for unsupported local details."""
    normalized = re.sub(r"\s+", " ", query.strip())

    if (
        CLEARANCE_QUERY_RE.search(normalized)
        and CLEARANCE_FEE_QUERY_RE.search(normalized)
    ):
        asks_for_amount = CLEARANCE_AMOUNT_QUERY_RE.search(normalized) or (
            CLEARANCE_FEE_AMOUNT_QUESTION_RE.search(normalized)
            and not CLEARANCE_EXEMPTION_QUERY_RE.search(normalized)
        )
        first_time_exemption_question = (
            FIRST_TIME_JOBSEEKER_RE.search(normalized)
            and not ORDINARY_CLEARANCE_RE.search(normalized)
            and not asks_for_amount
        )
        if not first_time_exemption_question:
            return GuardResult(
                triggered=True,
                reason="unsupported_query",
                message=(
                    "Ordinary barangay clearance fees and accepted payment methods are locally "
                    "determined. I can’t verify the current amount or payment options here; "
                    "please confirm them with the Barangay Hall or Treasurer. Ang karaniwang "
                    "bayad sa barangay clearance at mga tinatanggap na paraan ng pagbabayad "
                    "ay itinatakda sa lokal na ordinansa at patakaran. Hindi ko ma-verify ang "
                    "kasalukuyang halaga o payment options; magtanong sa Barangay Hall o Treasurer."
                ),
            )

    if any(pattern.search(normalized) for pattern in HALL_HOURS_QUERY_RES):
        return GuardResult(
            triggered=True,
            reason="unsupported_query",
            message=(
                "I can’t verify the current Barangay Hall hours from the official records "
                "available here. Please contact the Hall through the official contact below. "
                "Hindi ko ma-verify ang kasalukuyang oras ng Barangay Hall mula sa opisyal "
                "na tala rito. Mangyaring makipag-ugnayan sa Hall gamit ang opisyal na "
                "contact sa ibaba."
            ),
        )

    if INDIGENCY_QUERY_RE.search(normalized) and LOCAL_FEE_QUERY_RE.search(normalized):
        return GuardResult(
            triggered=True,
            reason="unsupported_query",
            message=(
                "The requirements and fees for a Certificate of Indigency depend on local "
                "policy and aren’t verified in the official records available here. Please "
                "confirm them with the Barangay Hall or Treasurer. Ang mga requirement at "
                "bayad para sa Certificate of Indigency ay nakabatay sa lokal na patakaran "
                "at hindi beripikado rito. Magtanong sa Barangay Hall o Treasurer."
            ),
        )

    return GuardResult(triggered=False)


# Patterns for government-issued identification numbers and references
GOV_ID_PATTERNS = [
    re.compile(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b'),  # 16-digit PhilSys / National ID
    re.compile(r'\b\d{2}[-\s]?\d{7}[-\s]?\d{1}\b'),              # SSS number (XX-XXXXXXX-X)
    re.compile(r'\b\d{2}[-\s]?\d{9}[-\s]?\d{1}\b'),              # PhilHealth 12-digit
    re.compile(r'\b[A-Z]\d{2}[-\s]?\d{2}[-\s]?\d{6}\b', re.IGNORECASE),  # PH Driver's License (e.g. N01-12-123456)
    re.compile(r'\b[A-PR-WY]\d{7}[A-Z0-9]\b', re.IGNORECASE),   # PH Passport number (e.g. P1234567A, p1234567a, P12345678, p12345678)
    re.compile(r'\b\d{3}[-\s]?\d{3}[-\s]?\d{3}(?:[-\s]?\d{3})?\b'),  # TIN
    re.compile(r'\b(?:philsys|national id|sss|tin|gsis|passport|pasaporte|voter[\'s]? id|prc license|driver[\'s]? license|philhealth|umid|postal id|cedula|ctc)\s*(?:(?:number|no\.?|#)\s*(?:is|:)?|(?:is|:))\s*[\w\d-]*\d[\w\d-]*\b', re.IGNORECASE),
]

# Patterns for personal identification and civil registry document probes (English, Tagalog, Taglish)
ID_DOCUMENT_SUBMISSION_PATTERNS = [
    re.compile(
        r'\b(?:eto\s+(?:po\s+)?ang|ito\s+(?:po\s+)?ang|here\s+is\s+my|attached\s+is\s+my|'
        r'upload(?:ed)?\s+my|check\s+my|paki-check\s+(?:ang\s+)?|tingnan\s+(?:mo\s+)?ang|'
        r'pakitingnan\s+ang|submitting\s+(?:my\s+)?|pinadala\s+ko\s+ang|nag-?upload\s+(?:ako\s+ng\s+)?)\s*'
        r'(?:valid\s+id|id|id\s+picture|kopya\s+ng\s+(?:valid\s+)?id|'
        r'picture\s+ng\s+(?:valid\s+)?id|larawan\s+ng\s+(?:valid\s+)?id|birth\s+cert(?:ificate)?|'
        r'cedula|passport|pasaporte|driver[\'s]?\s+license)\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'\b(?:my\s+(?:valid\s+id|passport|driver[\'s]?\s+license|cedula|birth\s+cert(?:ificate)?)\s+is|'
        r'(?:valid\s+id|passport|driver[\'s]?\s+license|cedula)\s+ko\s+ay|eto\s+ang\s+(?:cedula|passport|id)\s+ko|'
        r'(?:picture|kopya|larawan)\s+ng\s+(?:id|passport|cedula)\s+ko|(?:id|passport)\s+picture\s+ko|'
        r'attached\s+ang\s+(?:id|passport)\s+ko|eto\s+(?:id|passport)\s+ko)\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'\b(?:may\s+picture\s+ako\s+ng\s+(?:valid\s+)?id|picture\s+ng\s+passport\s+ko|'
        r'larawan\s+ng\s+id\s+ko|senend\s+ko\s+ang\s+id\s+ko|sinend\s+ko\s+ang\s+(?:id|passport)\s+ko)\b',
        re.IGNORECASE,
    ),
]

# Patterns for proof-of-billing and residence proof probes (English, Tagalog, Taglish)
BILLING_DOC_PATTERNS = [
    re.compile(
        r'\b(?:eto\s+(?:po\s+)?ang|ito\s+(?:po\s+)?ang|here\s+is\s+my|attached\s+is\s+my|'
        r'check\s+my|paki-check\s+(?:ang\s+)?|upload(?:ed)?\s+my|submitting\s+my|'
        r'sinend\s+ko\s+ang|senend\s+ko\s+ang)\s+'
        r'(?:proof\s+of\s+billing|billing\s+statement|meralco\s+bill|electric\s+bill|water\s+bill|'
        r'maynilad\s+bill|manila\s+water\s+bill|patunay\s+ng\s+tirahan|bill)\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'\b(?:proof\s+of\s+billing|billing\s+statement|meralco\s+bill|electric\s+bill|water\s+bill|'
        r'maynilad\s+bill|patunay\s+ng\s+tirahan)\s+(?:ko|ko\s+po|ko\s+ay)\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'\b(?:my\s+billing\s+statement|my\s+meralco\s+bill|my\s+electric\s+bill|my\s+water\s+bill|my\s+proof\s+of\s+billing)\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'\b(?:meralco|maynilad|manila\s+water|electric\s+bill|water\s+bill|utility|billing)\s*(?:account|acc\.?|acct\.?|meter|cust(?:omer)?)\s*(?:(?:no\.?|number|#)\s*(?:is|:)?|(?:is|:))\s*[\w\d-]*\d[\w\d-]*\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'\b(?:billing\s+account|utility\s+account|electric\s+account|water\s+account)\s*(?:(?:no\.?|number|#)\s*(?:is|:)?|(?:is|:))\s*[\w\d-]*\d[\w\d-]*\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'\baccount\s*(?:no\.?|number|#)\s*(?:is|:)?\s*\d{6,}\b',
        re.IGNORECASE,
    ),
]

# Patterns for credentials and authentication tokens
CREDENTIAL_PATTERNS = [
    re.compile(r'\b(?:my\s+)?(?:password|passkey|pin(?:\s+code)?|otp|auth(?:\s+token)?|secret(?:\s+key)?)\b', re.IGNORECASE),
]

# Patterns for personal document / service request tracking
REQUEST_STATUS_PATTERNS = [
    re.compile(r'\bdoc[-_]?[0-9a-fA-F-]+\b', re.IGNORECASE),
    re.compile(r'\b(?:status\s+of\s+my|track\s+my|where\s+is\s+my|check\s+my)\s+(?:document|request|application|clearance|certificate|permit)\b', re.IGNORECASE),
    re.compile(r'\bmy\s+document\s+request\b', re.IGNORECASE),
    re.compile(r'\bmy\s+application\s+status\b', re.IGNORECASE),
]

# Patterns for personal queue tickets
QUEUE_STATUS_PATTERNS = [
    re.compile(r'\b(?:my\s+)?queue\s+ticket\b', re.IGNORECASE),
    re.compile(r'\bticket\s*#?\s*\d+\b', re.IGNORECASE),
    re.compile(r'\b(?:my\s+turn\s+in\s+line|what\s+number\s+is\s+serving|my\s+queue\s+number)\b', re.IGNORECASE),
    re.compile(r'\bwhen\s+is\s+my\s+turn\b', re.IGNORECASE),
]

# Patterns for personal payment proof, receipts, transactions, and references (English, Tagalog, Taglish)
PAYMENT_PATTERNS = [
    re.compile(r'\b(?:proof\s+of\s+payment|official\s+receipt|or\s+number|or\s*#|receipt\s*(?:no\.?|number|#))\b', re.IGNORECASE),
    re.compile(r'\b(?:did\s+you\s+receive\s+my\s+payment|verify\s+my\s+payment|payment\s+status|check\s+my\s+payment|status\s+of\s+my\s+payment)\b', re.IGNORECASE),
    re.compile(r'\b(?:paid\s+(?:through|via|using)\s+(?:gcash|maya|bank))\b', re.IGNORECASE),
    re.compile(r'\b(?:gcash|maya|paymaya|bank|online)\s*(?:ref(?:erence)?|txn|transaction|receipt)?\s*(?:(?:no\.?|number|#)\s*(?:is|:)?|(?:is|:))\s*[\w\d-]*\d[\w\d-]*\b', re.IGNORECASE),
    re.compile(r'\b(?:gcash|maya|paymaya)\s+(?:ref(?:erence)?|txn|transaction|receipt)\s*[\w\d-]*\d[\w\d-]*\b', re.IGNORECASE),
    re.compile(r'\b(?:ref(?:erence)?\s*(?:no\.?|number|#)\s*(?:is|:)?\s*[\w\d-]+|transaction\s*(?:id|no\.?|number|#)\s*(?:is|:)?\s*[\w\d-]+)\b', re.IGNORECASE),
    re.compile(r'\b(?:nagbayad\s+na\s+(?:po\s+)?ako|bayad\s+na\s+(?:po\s+)?ako|nabayaran\s+ko\s+na|pumasok\s+ba\s+ang\s+bayad\s+ko|na-receive\s+ba\s+ang\s+bayad\s+ko|natanggap\s+ba\s+ang\s+bayad\s+ko|tingnan\s+mo\s+kung\s+bayad\s+na|nagsend\s+na\s+(?:po\s+)?ako\s+ng\s+bayad|nagpadala\s+na\s+(?:po\s+)?ako\s+ng\s+bayad|sinend\s+ko\s+na\s+ang\s+bayad)\b', re.IGNORECASE),
    re.compile(r'\b(?:resibo\s+ko|resibo\s+number|resibo\s*#|patunay\s+ng\s+bayad|screenshot\s+ng\s+bayad|katibayan\s+ng\s+bayad)\b', re.IGNORECASE),
    re.compile(r'\b(?:bayad\s+ko\s+sa\s+(?:gcash|maya|bank|clearance))\b', re.IGNORECASE),
    re.compile(r'\b(?:my|attached|uploaded|submitted|eto(?:\s+po)?|may|meron)\b.{0,80}\b(?:gcash|maya|paymaya)\b.{0,40}\b(?:receipt|resibo)\b|\b(?:gcash|maya|paymaya)\b.{0,40}\b(?:receipt|resibo)\b.{0,80}\b(?:reference|ref|txn|transaction|no\.?|number|#)\b', re.IGNORECASE),
    re.compile(r'\bmay\s+reference\s+number\s+ako\b', re.IGNORECASE),
]

# Patterns for blotter, disputes, and incident narratives
BLOTTER_INCIDENT_PATTERNS = [
    re.compile(r'\b(?:blotter|incident\s+report|file\s+a\s+complaint|report\s+my\s+neighbor|domestic\s+dispute|vawc|patawag\s+sa\s+barangay|complaint\s+against)\b', re.IGNORECASE),
    re.compile(r'\b(?:hearing\s+schedule|lupon\s+tagapamayapa|kasong\s+barangay)\b', re.IGNORECASE),
]

# Patterns for automated decision or aid granting requests
AUTOMATED_DECISION_PATTERNS = [
    re.compile(r'\b(?:approve\s+my|grant\s+me|give\s+me\s+financial\s+aid|give\s+me\s+ayuda|can\s+you\s+approve|decide\s+on\s+my)\b', re.IGNORECASE),
]

# Patterns for personal contact information (emails, phone numbers)
EMAIL_PATTERNS = [
    re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
]

# Comprehensive Philippine telephone detection (mobile, Metro Manila landlines, provincial landlines)
# Covers:
# - Mobile: 09XX-XXX-XXXX, +63 9XX XXX XXXX, (09XX) XXX-XXXX, 09XXXXXXXXX
# - Metro Manila (Area Code 2 / 02, 8-digit subscriber): (02) 8XXX-XXXX, 02-8XXX-XXXX, +63 2 8XXX XXXX, 028XXXXXXX
# - Provincial (Area Codes 32-88, 7-digit subscriber): (046) 4XX-XXXX, 046-4XX-XXXX, +63 46 4XX XXXX, (032) 2XX-XXXX, (042) 7XX-XXXX, +63 (46) 4XX-XXXX
PHONE_PATTERNS = [
    # 1. Philippine mobile numbers (+63 / 09 / (09xx))
    re.compile(r'(?:\+63[-\s]?\(?0?9\d{2}\)?|\(09\d{2}\)|\b09\d{2})[-.\s]?\d{3}[-.\s]?\d{4}\b'),
    re.compile(r'(?:\+63|0)9\d{9}\b'),
    # 2. Metro Manila landline (+63 2 / (02) / 02) with 8-digit subscriber number
    re.compile(r'(?:\+63[-.\s]?\(?0?2\)?|\(0?2\)[-.\s]*|\b02)[-.\s]?\d{4}[-.\s]?\d{4}\b'),
    re.compile(r'(?:\+63[-.\s]?2|\b02)\d{8}\b'),
    # 3. Provincial landlines (+63 XX / (0XX) / 0XX) with 7-digit subscriber number (area codes 32-88)
    re.compile(r'(?:\((?:0?[3-8]\d|\+63[-.\s]?0?[3-8]\d)\)|\+63[-.\s]?\(?0?[3-8]\d\)?|\b0[3-8]\d)[-.\s]?\d{3}[-.\s]?\d{4}\b'),
    re.compile(r'(?:\+63[-.\s]?0?[3-8]\d|\b0[3-8]\d)\d{7}\b'),
]


def contains_email_address(text: str) -> bool:
    """
    Detects email addresses in text.
    Shared consistently across resident queries and announcement/activity source screening.
    """
    if not text:
        return False
    for pattern in EMAIL_PATTERNS:
        if pattern.search(text):
            return True
    return False


def contains_ph_phone_number(text: str) -> bool:
    """
    Detects Philippine phone numbers (mobile, Metro Manila, provincial landlines) in text.
    Shared consistently across resident queries and announcement/activity source screening.

    Limits: While these patterns cover standard domestic and international formats with
    hyphens, spaces, periods, or parentheses, regex heuristics cannot guarantee 100% detection
    of all deliberately obfuscated, spelled-out, or idiosyncratic contact numbers.
    Defense-in-depth is maintained through local source screening, staff review, and query non-persistence.
    """
    if not text:
        return False
    for pattern in PHONE_PATTERNS:
        if pattern.search(text):
            return True
    return False


# Patterns for prompt injection, jailbreaking, or system extraction
PROMPT_INJECTION_PATTERNS = [
    re.compile(r'\b(?:ignore\s+(?:all\s+)?previous\s+instructions|disregard\s+instructions|system\s+prompt|developer\s+mode|jailbreak|dan\s+mode|reveal\s+(?:your\s+)?instructions)\b', re.IGNORECASE),
]

# Patterns for screening untrusted staff-authored source content (prompt injection / instructions)
SOURCE_INJECTION_PATTERNS = [
    re.compile(r'\b(?:ignore\s+(?:all\s+)?previous\s+instructions|disregard\s+instructions|system\s+prompt|developer\s+mode|jailbreak|dan\s+mode|reveal\s+(?:your\s+)?instructions)\b', re.IGNORECASE),
    re.compile(r'\b(?:new\s+system\s+prompt|override\s+instructions|you\s+are\s+now|forget\s+all\s+prior)\b', re.IGNORECASE),
]

# Patterns for local source content screening (omitting suspect records)
SENSITIVE_SOURCE_PATTERNS = [
    re.compile(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b'),  # 16-digit PhilSys / National ID
    re.compile(r'\b\d{2}[-\s]?\d{7}[-\s]?\d{1}\b'),              # SSS
    re.compile(r'\b\d{2}[-\s]?\d{9}[-\s]?\d{1}\b'),              # PhilHealth 12-digit
    re.compile(r'\b[A-Z]\d{2}[-\s]?\d{2}[-\s]?\d{6}\b', re.IGNORECASE),  # PH Driver's License
    re.compile(r'\b[A-PR-WY]\d{7}[A-Z0-9]\b', re.IGNORECASE),   # PH Passport format
    re.compile(r'\b\d{3}[-\s]?\d{3}[-\s]?\d{3}(?:[-\s]?\d{3})?\b'),  # TIN
    re.compile(r'\b(?:philsys|national id|sss|tin|gsis|passport|pasaporte|voter[\'s]? id|prc license|driver[\'s]? license|philhealth|umid|postal id|cedula|ctc)\s*(?:(?:number|no\.?|#)\s*(?:is|:)?|(?:is|:))\s*[\w\d-]*\d[\w\d-]*\b', re.IGNORECASE),
    re.compile(r'\b(?:meralco|maynilad|manila\s+water|electric\s+bill|water\s+bill|utility|billing)\s*(?:account|acc\.?|acct\.?|meter|cust(?:omer)?)\s*(?:(?:no\.?|number|#)\s*(?:is|:)?|(?:is|:))\s*[\w\d-]*\d[\w\d-]*\b', re.IGNORECASE),
    re.compile(r'\baccount\s*(?:no\.?|number|#)\s*(?:is|:)?\s*\d{6,}\b', re.IGNORECASE),
    re.compile(r'\b(?:gcash|maya|paymaya|bank|online)\s*(?:ref(?:erence)?|txn|transaction|receipt)?\s*(?:(?:no\.?|number|#)\s*(?:is|:)?|(?:is|:))\s*[\w\d-]*\d[\w\d-]*\b', re.IGNORECASE),
    re.compile(r'\b(?:ref(?:erence)?\s*(?:no\.?|number|#)\s*(?:is|:)?\s*[\w\d-]+|transaction\s*(?:id|no\.?|number|#)\s*(?:is|:)?\s*[\w\d-]+)\b', re.IGNORECASE),
]


def check_privacy_and_intent(query: str) -> GuardResult:
    """
    Evaluates a user query against deterministic privacy, security, and intent rules.
    Returns GuardResult(triggered=True, ...) if the query violates data boundaries.
    """
    normalized = query.strip()

    # Check personal contact info (email addresses)
    if contains_email_address(normalized):
        return GuardResult(
            triggered=True,
            reason="privacy_guard_contact_info",
            message=(
                "For your privacy and security under Republic Act 10173, please do not share "
                "email addresses or personal contact information. The navigator only answers "
                "general public barangay inquiries. For direct inquiries, please contact the "
                "Barangay Hall using official channels or visit in person."
            ),
        )

    # Check personal contact info (phone numbers: mobile, Metro Manila, provincial landlines)
    if contains_ph_phone_number(normalized):
        return GuardResult(
            triggered=True,
            reason="privacy_guard_contact_info",
            message=(
                "For your privacy and security under Republic Act 10173, please do not share "
                "personal phone numbers or contact details. The navigator only answers "
                "general public barangay inquiries. For direct inquiries, please contact the "
                "Barangay Hall using official channels or visit in person."
            ),
        )

    # Check ID document submissions and personal ID picture probes
    for pattern in ID_DOCUMENT_SUBMISSION_PATTERNS:
        if pattern.search(normalized):
            return GuardResult(
                triggered=True,
                reason="privacy_guard_doc_submission",
                message=(
                    "For your privacy and security under Republic Act 10173, please do not share "
                    "copies, pictures, or submissions of personal IDs or civil registry documents with the navigator. "
                    "The navigator only answers general public barangay inquiries. For ID verification or document submission, "
                    "please use the official document request service or visit the Barangay Hall in person."
                ),
            )

    # Check proof-of-billing and residence proof probes
    for pattern in BILLING_DOC_PATTERNS:
        if pattern.search(normalized):
            return GuardResult(
                triggered=True,
                reason="privacy_guard_billing_doc",
                message=(
                    "For your privacy and security under Republic Act 10173, please do not share "
                    "billing statements, account proofs, or personal utility bills with the navigator. "
                    "The navigator only answers general public barangay inquiries. To submit proof of residency, "
                    "please use the official document request service or present documents directly at the Barangay Hall."
                ),
            )

    # Check personal payments, receipts, and transaction references
    for pattern in PAYMENT_PATTERNS:
        if pattern.search(normalized):
            return GuardResult(
                triggered=True,
                reason="privacy_guard_payment",
                message=(
                    "The navigator does not process, verify, or inspect personal payment transactions, "
                    "receipts, or reference numbers. For payment verification, please refer to your submitted "
                    "document request in the portal or speak with the Barangay Treasurer at the Barangay Hall."
                ),
            )

    # Check government IDs
    for pattern in GOV_ID_PATTERNS:
        if pattern.search(normalized):
            return GuardResult(
                triggered=True,
                reason="privacy_guard_gov_id",
                message=(
                    "For your privacy and security under Republic Act 10173, please do not share "
                    "government ID numbers or personal identification details. The navigator only "
                    "answers general public barangay inquiries. For assistance with ID verification, "
                    "please visit the Barangay Hall in person."
                ),
            )

    # Check credentials
    for pattern in CREDENTIAL_PATTERNS:
        if pattern.search(normalized):
            return GuardResult(
                triggered=True,
                reason="privacy_guard_credentials",
                message=(
                    "Security Notice: Never share passwords, PINs, or credentials. The navigator "
                    "does not manage user authentication. You can manage your password in the resident portal settings."
                ),
            )

    # Check personal request tracking
    for pattern in REQUEST_STATUS_PATTERNS:
        if pattern.search(normalized):
            return GuardResult(
                triggered=True,
                reason="privacy_guard_request_tracking",
                message=(
                    "The Public Information AI Navigator does not access individual document records "
                    "or private applications. To view the status of your document requests, please check "
                    "the 'My Requests' section of the resident portal."
                ),
            )

    # Check queue tickets
    for pattern in QUEUE_STATUS_PATTERNS:
        if pattern.search(normalized):
            return GuardResult(
                triggered=True,
                reason="privacy_guard_queue_ticket",
                message=(
                    "The navigator cannot look up active queue tickets or line positions. "
                    "Please navigate to the 'Live Queue' tab in the resident portal to check your queue status."
                ),
            )
    # Check blotter / disputes
    for pattern in BLOTTER_INCIDENT_PATTERNS:
        if pattern.search(normalized):
            return GuardResult(
                triggered=True,
                reason="privacy_guard_incident_blotter",
                message=(
                    "Confidentiality Notice: Barangay blotter cases, complaints, and dispute settlements "
                    "(Katarungang Pambarangay) are confidential and cannot be processed or discussed here. "
                    "Please file reports through the official portal reporting tool or visit the Barangay Hall / "
                    "Lupong Tagapamayapa desk directly."
                ),
            )

    # Check automated decision requests
    for pattern in AUTOMATED_DECISION_PATTERNS:
        if pattern.search(normalized):
            return GuardResult(
                triggered=True,
                reason="privacy_guard_automated_decision",
                message=(
                    "The navigator is an informational guide and cannot approve requests, make administrative "
                    "determinations, or disburse financial aid. Official decisions are made exclusively by "
                    "authorized Barangay Officials."
                ),
            )

    # Check prompt injection / jailbreaks
    for pattern in PROMPT_INJECTION_PATTERNS:
        if pattern.search(normalized):
            return GuardResult(
                triggered=True,
                reason="privacy_guard_security",
                message=(
                    "This system is designed exclusively to answer questions about public barangay "
                    "information using verified local sources. How can I help you with barangay documents, "
                    "activities, or hotlines?"
                ),
            )

    return GuardResult(triggered=False)


def contains_sensitive_data(text: str) -> bool:
    """
    Checks if a text string contains likely personal data patterns (emails, phone numbers, IDs)
    or prompt injection phrases that should disqualify it from being included in an external LLM prompt bundle.
    """
    if not text:
        return False
    if contains_email_address(text):
        return True
    if contains_ph_phone_number(text):
        return True
    for pattern in SENSITIVE_SOURCE_PATTERNS:
        if pattern.search(text):
            return True
    return contains_source_prompt_injection(text)


def contains_source_prompt_injection(text: str) -> bool:
    """Return whether untrusted source text contains a known prompt-injection phrase."""
    return bool(text) and any(pattern.search(text) for pattern in SOURCE_INJECTION_PATTERNS)


def is_source_content_safe(text: str) -> bool:
    """
    Returns True if the source content is safe for inclusion in the AI prompt bundle;
    returns False if it contains sensitive personal data or prompt injection patterns.
    """
    return not contains_sensitive_data(text)
