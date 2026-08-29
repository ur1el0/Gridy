# ADR 003: OpenAPI 3.0 Contract-Driven Development

## Status
Accepted

## Context
Gridy serves two frontend clients: a React Admin Web Dashboard and a Flutter Mobile Application. Without a centralized, machine-readable API specification, changes made to the backend views (e.g., changes to endpoint URLs or required request keys) can silently break client applications.

## Decision
We chose `drf-spectacular` to automatically generate and validate an OpenAPI 3.0 schema directly from our Django REST Framework codebase.
- **Dynamic Compilation**: The schema endpoint `/api/schema/` generates a YAML/JSON contract representing the latest live codebase.
- **Interactive UIs**: Exposes `/api/schema/swagger-ui/` and `/api/schema/redoc/` endpoints for developer-friendly endpoint discovery.
- **Client Auto-Generation**: Allows the frontend applications to auto-generate type-safe HTTP clients (e.g., using Orval or OpenAPI Generator), preventing serialization and parameter drift.

## Consequences
- Requires developers to annotate ViewSets using `@extend_schema` decorators when DRF cannot automatically infer request/response models.
- Guarantees that the backend and frontends stay fully synchronized.
