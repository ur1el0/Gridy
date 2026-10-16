# Project History and Delivery Roadmap

This page is a brief historical summary of the project, not the active backlog, release plan, or a guarantee that every proposed item shipped. Use current GitHub Issues and task packets for active work; see [Issue Tracking](../docs/README.md#issue-tracking-and-task-history).

## Historical phases

1. Established the Django API, React client, authentication, barangay data model, and core service workflows.
2. Added resident mobile capabilities, communications, document requests, queues, and incident reporting.
3. Hardened tenant isolation, auditability, private evidence access, fee assessment, and manual treasury workflows.
4. Added account lifecycle, resident evidence management, operational notifications, and public-information navigation behind explicit controls.

The project has changed through many task-specific branches and pull requests. Old sprint descriptions may refer to features that changed or were never released. Verify current behavior against implementation, tests, accepted ADRs, and the active task packet before relying on a historical statement.

## Current planning source

- Current issues and their status: repository issue tracker.
- Scoped implementation agreements: `docs/ai-workflow/tasks/<task-id>/TASK_BRIEF.md` and `PLAN.md` when available.
- Operational evidence: the corresponding task `STATUS.md`, with exact commands and observed outputs.
- Accepted architectural decisions: [ADR index](decisions/README.md).
