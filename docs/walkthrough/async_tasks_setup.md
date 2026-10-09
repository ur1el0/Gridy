# Asynchronous Background Task Architecture (`@async_task`)

This guide outlines the background task execution architecture in KapitBayan, which decouples long-running I/O operations from the synchronous HTTP request-response cycle.

---

## 1. Architectural Evolution & ADR 009 Alignment

During early development, Celery worker processes and a Redis message broker were introduced to handle background tasks. However, an unvarnished audit against the approved Capstone 1 manuscript revealed:
1. **Scope Over-Engineering**: The approved project proposal contracts a pure 3-tier architecture. Celery and Redis introduced unnecessary operational fragility, port conflicts, and race conditions during database migrations.
2. **LGU Operational Reality**: Running a separate Redis broker and multi-process Celery worker on local LGU hardware consumed disproportionate system memory (~1.8 GB).

Per **ADR 009**, Celery and Redis were decommissioned and replaced with a native, non-blocking Python daemon thread decorator (`@async_task`).

---

## 2. The `@async_task` Engine (`gridy_auth/tasks.py`)

The decorator wraps functions in a background thread while exposing a `.delay()` alias. This preserves standard Celery-style call-site syntax without any external broker or daemon dependencies:

```python
import functools
import threading

def async_task(func):
    """
    Decorator that executes a function in a background daemon thread,
    providing .delay() compatibility so call sites work seamlessly without Celery or Redis.
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        thread = threading.Thread(target=func, args=args, kwargs=kwargs, daemon=True)
        thread.start()
        return thread
    
    wrapper.delay = wrapper
    return wrapper