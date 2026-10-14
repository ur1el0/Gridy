import logging
from django.db import transaction
from gridy_audit.models import AuditLog
from gridy_audit.services import log_action

logger = logging.getLogger(__name__)


def _safe_delete_private_file(storage, file_name, user_id):
    """Delete resident evidence after commit without exposing storage errors."""
    if not storage or not file_name:
        return
    try:
        if storage.exists(file_name):
            storage.delete(file_name)
    except Exception as exc:
        logger.warning(
            "Failed to delete private identity media for user %s (%s).",
            user_id,
            type(exc).__name__,
        )


def erase_user_account(user, reason, request=None, actor=None):
    """
    Safely erases or removes a user account while adhering to RA 10173 and COA audit rules:
    1. Records an audit log event preserving accountability before deletion.
    2. Revokes all active JWT refresh sessions.
    3. Safely deletes uploaded private identity documents/proofs from storage.
    4. Preserves statutory document clearances, official receipts (O.R.), fee assessments,
       and aid assistance history by dissociating the user foreign keys and snapshotting names.
    5. Deletes the User record.
    """
    from gridy_auth.models import RefreshSession
    from gridy_services.models import DocumentRequest, AidRequest

    effective_actor = actor or user
    resident = getattr(user, 'profile', None)
    user_id = user.pk
    resident_name = resident.full_name if resident else (user.get_full_name() or user.username)

    with transaction.atomic():
        # 1. Log audit trail before destruction
        log_action(
            user=effective_actor,
            action_type=AuditLog.ActionType.USER_ACTION,
            description=reason,
            request=request,
        )

        # 2. Revoke all active refresh sessions
        RefreshSession.objects.filter(user=user).update(is_revoked=True)

        # 3. Capture private identity files for cleanup only after database commit.
        # If any later database operation rolls back, the active account keeps its files.
        files_to_delete = []
        if resident:
            for field_name in ('philsys_id_photo', 'secondary_id_photo', 'utility_billing_photo'):
                file_field = getattr(resident, field_name, None)
                if file_field and file_field.name:
                    files_to_delete.append((file_field.storage, file_field.name))

        # 4. Preserve Document Request history (COA Treasury compliance & ADR 007)
        for doc in DocumentRequest.objects.filter(user=user):
            if not doc.walkin_name:
                doc.walkin_name = resident_name
            doc.user = None
            doc.save(update_fields=['walkin_name', 'user'])

        # Preserve Aid Request history
        AidRequest.objects.filter(requester=user).update(requester=None)

        # 5. Delete user object
        user.delete()

        for storage, file_name in files_to_delete:
            transaction.on_commit(
                lambda s=storage, n=file_name, uid=user_id: _safe_delete_private_file(s, n, uid)
            )
