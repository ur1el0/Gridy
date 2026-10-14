"""
Bounded public information retrieval service for the Public Information AI Navigator.

Strictly scopes all queries to the resident's assigned Barangay and approved public sources.
Under no circumstances are private models (DocumentRequest, QueueTicket, AidRequest, IssueReport,
Resident profile PII) or the unpartitioned FAQ table queried.
"""

import logging
import re
from typing import Dict, List, Optional
from zoneinfo import ZoneInfo
from django.utils import timezone

from gridy_auth.models import Barangay
from gridy_communications.models import Announcement, ActivitySchedule, EmergencyHotline
from gridy_communications.navigator.catalog import STATUTORY_CATALOG
from gridy_communications.navigator.guard import (
    contains_sensitive_data,
    contains_source_prompt_injection,
    is_source_content_safe,
)

logger = logging.getLogger(__name__)

MANILA_TZ = ZoneInfo("Asia/Manila")
URL_REGEX = re.compile(r'https?://[^\s]+|\bwww\.[^\s]+', re.IGNORECASE)

# Bounded retrieval budgets to prevent oversized prompt injection or context blowup
MAX_ANNOUNCEMENT_CONTENT_CHARS = 500
MAX_ACTIVITY_CONTENT_CHARS = 400
MAX_ACTIVITY_RECORD_CONTENT_CHARS = 600
MAX_AGGREGATE_SOURCE_BUNDLE_CHARS = 4000


def truncate_to_limit(text: str, limit: int, marker: str = "...") -> str:
    """
    Truncates text to ensure len(result) <= limit strictly, including the truncation marker.
    If the text length is already <= limit, returns the text unmodified.
    """
    if len(text) <= limit:
        return text
    if limit <= len(marker):
        return marker[:limit]
    allowed = limit - len(marker)
    return text[:allowed].rstrip() + marker

# Placeholder strings that indicate unverified or demo contact fields
INVALID_CONTACT_PLACEHOLDERS = {
    "n/a",
    "none",
    "tbd",
    "null",
    "placeholder",
    "demo",
    "unknown",
    "000-0000",
}


def sanitize_source_text(text: str, min_len: int = 15) -> Optional[str]:
    """
    Strips web URLs, links with query parameters, and markdown links from source text.
    If stripping leaves the content empty or misleadingly brief (< min_len characters),
    returns None to safely omit the affected record from the navigator prompt bundle.
    """
    if not text:
        return None
    # Strip markdown link syntax: [link text](url) -> keep link text
    cleaned = re.sub(r'\[([^\]]+)\]\s*\([^\)]+\)', r'\1', text)
    # Strip web URLs (http://, https://, www., including query parameters and fragments)
    cleaned = URL_REGEX.sub('', cleaned)
    # Collapse multiple whitespaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    if len(cleaned) < min_len:
        return None
    return cleaned


def format_manila_datetime(dt) -> str:
    """Formats a datetime in Asia/Manila timezone."""
    if not timezone.is_aware(dt):
        dt = timezone.make_aware(dt, timezone.utc)
    return dt.astimezone(MANILA_TZ).strftime("%Y-%m-%d %I:%M %p")


def is_valid_office_contact(contact: Optional[str]) -> bool:
    """Checks whether Barangay.office_contact contains a genuine, non-placeholder contact string."""
    if not contact:
        return False
    cleaned = contact.strip()
    if len(cleaned) < 3:
        return False
    if cleaned.casefold() in INVALID_CONTACT_PLACEHOLDERS:
        return False
    return True


def retrieve_public_sources(barangay_id: int) -> Dict[str, dict]:
    """
    Retrieves approved, tenant-scoped public source records for the given Barangay.
    Returns a dictionary mapping source_id -> source_metadata_dict.
    """
    sources: Dict[str, dict] = {}

    # 1. Statutory Document Catalog (National laws and verified exemption policies)
    for entry in STATUTORY_CATALOG:
        sources[entry["id"]] = {
            "id": entry["id"],
            "title": entry["title"],
            "category": entry["category"],
            "reference": entry["reference"],
            "updated_at": entry["updated_at"],
            "content": entry["content"],
        }

    # 2. Same-Barangay Opted-in Announcements
    announcements = (
        Announcement.objects.filter(
            created_by__barangay_id=barangay_id,
            navigator_ai_enabled=True,
        )
        .order_by("-is_pinned", "-created_at")[:5]
    )
    for ann in announcements:
        full_text = f"{ann.title} {ann.content}"
        if not is_source_content_safe(full_text):
            logger.info("Omitted announcement %s from navigator bundle due to sensitive or prompt-injection pattern match.", ann.id)
            continue

        sanitized_title = sanitize_source_text(ann.title, min_len=3)
        sanitized_content = sanitize_source_text(ann.content, min_len=15)
        if sanitized_title is None or sanitized_content is None:
            logger.info("Omitted announcement %s from navigator bundle because sanitization left misleading or insufficient content.", ann.id)
            continue

        sanitized_content = truncate_to_limit(sanitized_content, MAX_ANNOUNCEMENT_CONTENT_CHARS)

        source_id = f"announcement:{ann.id}"
        sources[source_id] = {
            "id": source_id,
            "title": sanitized_title,
            "category": "announcement",
            "reference": f"Barangay Announcement #{ann.id}",
            "updated_at": ann.updated_at.isoformat() if ann.updated_at else None,
            "content": sanitized_content,
        }

    # 3. Same-Barangay Future-Only Opted-in Activities
    now = timezone.now()
    activities = (
        ActivitySchedule.objects.filter(
            created_by__barangay_id=barangay_id,
            navigator_ai_enabled=True,
            event_datetime__gte=now,
        )
        .order_by("event_datetime")[:5]
    )
    for act in activities:
        full_text = f"{act.title} {act.description} {act.location}"
        if not is_source_content_safe(full_text):
            logger.info("Omitted activity %s from navigator bundle due to sensitive or prompt-injection pattern match.", act.id)
            continue

        sanitized_title = sanitize_source_text(act.title, min_len=3)
        sanitized_desc = sanitize_source_text(act.description, min_len=15)
        sanitized_location = sanitize_source_text(act.location, min_len=3)
        if sanitized_title is None or sanitized_desc is None or sanitized_location is None:
            logger.info("Omitted activity %s from navigator bundle because sanitization left misleading or insufficient content.", act.id)
            continue

        event_time_str = format_manila_datetime(act.event_datetime)
        sanitized_desc = truncate_to_limit(sanitized_desc, MAX_ACTIVITY_CONTENT_CHARS)

        source_id = f"activity:{act.id}"
        act_content = (
            f"Activity: {sanitized_title}. Scheduled Date & Time: {event_time_str} (Asia/Manila). "
            f"Location: {sanitized_location}. Description: {sanitized_desc}"
        )
        act_content = truncate_to_limit(act_content, MAX_ACTIVITY_RECORD_CONTENT_CHARS)

        sources[source_id] = {
            "id": source_id,
            "title": sanitized_title,
            "category": "activity",
            "reference": f"Barangay Activity #{act.id}",
            "updated_at": act.updated_at.isoformat() if act.updated_at else None,
            "content": act_content,
        }

    # 4. Same-Barangay Active Emergency Hotlines
    hotlines = (
        EmergencyHotline.objects.filter(
            created_by__barangay_id=barangay_id,
            is_active=True,
        )
        .order_by("category", "name")[:10]
    )
    for hot in hotlines:
        source_id = f"hotline:{hot.id}"
        title = f"{hot.name} ({hot.get_category_display()})"
        content = (
            f"Emergency Contact: {hot.name}. Contact Number: {hot.number}. "
            f"Category: {hot.get_category_display()}."
        )
        if contains_source_prompt_injection(f"{title} {content}"):
            logger.info("Omitted navigator source id=%s due to prompt injection", source_id)
            continue
        sources[source_id] = {
            "id": source_id,
            "title": title,
            "category": "hotline",
            "reference": f"Barangay Emergency Hotline #{hot.id}",
            "updated_at": hot.updated_at.isoformat() if hot.updated_at else None,
            "content": content,
        }

    # 5. Verified Barangay Office Contact
    barangay = Barangay.objects.filter(id=barangay_id).first()
    if barangay and is_valid_office_contact(barangay.office_contact):
        source_id = "office_contact"
        title = f"Barangay Hall Office Contact ({barangay.name})"
        content = f"Barangay {barangay.name} Office Contact: {barangay.office_contact.strip()}."
        if contains_source_prompt_injection(f"{title} {content}"):
            logger.info("Omitted navigator source id=%s due to prompt injection", source_id)
        else:
            sources[source_id] = {
                "id": source_id,
                "title": title,
                "category": "contact",
                "reference": "Barangay Official Registry",
                "updated_at": None,
                "content": content,
            }

    # Enforce aggregate source bundle text budget strictly
    total_chars = 0
    bounded_bundle: Dict[str, dict] = {}
    for sid, sdata in sources.items():
        content = sdata.get("content", "")
        content_len = len(content)
        if total_chars + content_len > MAX_AGGREGATE_SOURCE_BUNDLE_CHARS:
            remaining_budget = max(0, MAX_AGGREGATE_SOURCE_BUNDLE_CHARS - total_chars)
            if remaining_budget >= 100:
                sdata_copy = dict(sdata)
                sdata_copy["content"] = truncate_to_limit(content, remaining_budget)
                bounded_bundle[sid] = sdata_copy
                total_chars += len(sdata_copy["content"])
            break
        bounded_bundle[sid] = sdata
        total_chars += content_len

    return bounded_bundle


def build_escalation_data(barangay_id: int) -> dict:
    """
    Constructs the escalation block containing verified office contacts,
    active emergency hotlines, and an in-person Barangay Hall notice.
    """
    barangay = Barangay.objects.filter(id=barangay_id).first()
    office_contact = (
        barangay.office_contact.strip()
        if (barangay and is_valid_office_contact(barangay.office_contact))
        else None
    )

    hotlines = (
        EmergencyHotline.objects.filter(
            created_by__barangay_id=barangay_id,
            is_active=True,
        )
        .order_by("category", "name")[:5]
    )

    b_name = barangay.name if barangay else "your Barangay"
    return {
        "office_contact": office_contact,
        "hotlines": [
            {
                "name": h.name,
                "number": h.number,
                "category": h.get_category_display(),
            }
            for h in hotlines
        ],
        "barangay_hall_notice": (
            f"For official transactions, document fee assessments, or inquiries not listed here, "
            f"please visit the Barangay Hall of {b_name} in person."
        ),
    }


def format_available_sources_fallback(source_bundle: Dict[str, dict], limit: int = 4) -> List[dict]:
    """
    Returns a small subset of public sources to show in unavailable/degraded fallback states.
    Strips raw prompt 'content' to preserve compact schema.
    """
    clean_list = []
    for s in list(source_bundle.values())[:limit]:
        clean_list.append({
            "id": s["id"],
            "title": s["title"],
            "category": s["category"],
            "reference": s.get("reference", ""),
            "updated_at": s.get("updated_at"),
        })
    return clean_list
