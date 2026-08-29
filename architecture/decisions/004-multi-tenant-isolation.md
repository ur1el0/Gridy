# ADR 004: Strict Multi-Tenant Data Isolation

## Status
Accepted

## Context
Gridy is designed to operate as a centralized platform for multiple Local Government Units (LGUs). A Barangay Official from Barangay A must never be able to view, edit, or interact with citizens, documents, or issue reports belonging to Barangay B. Standard Django REST Framework (DRF) patterns default to `Model.objects.all()`, which exposes the entire database to anyone with a valid authentication token.

## Decision
We will reject the use of unfiltered querysets in all endpoint definitions. 
Instead, every DRF ViewSet must explicitly override the `get_queryset()` method to filter data strictly by the authenticated user's assigned `barangay_id`. 

For highly complex custom `@action` methods (e.g., Live Queue ticket progression), we enforce a strict parameterized boundary on all internal ORM lookups:
`QueueTicket.objects.filter(barangay=self.request.user.barangay)`

## Consequences
* **Positive:** Complete elimination of cross-tenant data leaks. Satisfies the Data Privacy Act of 2012 by ensuring PII is only accessible to authorized personnel within the specific LGU jurisdiction.
* **Positive:** Improved database query performance, as queries are horizontally partitioned by tenant ID via indexes.
* **Negative:** Increased developer friction. Developers cannot rely on default DRF mixins and must remember to inject the tenant boundary into every single endpoint and raw query.
