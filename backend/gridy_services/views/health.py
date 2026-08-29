import time
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connections
from django.db.utils import OperationalError
from django.core.cache import cache

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    System health monitoring endpoint checking Database and Cache dependencies.
    """

    health_data = {
        "status": "healthy",
        "services": {}
    }

    # 1. Database Check
    db_start = time.time()
    try:
        connections['default'].cursor()
        db_latency = round((time.time() - db_start) * 1000, 2)
        health_data["services"]["database"] = {
            "status": "healthy",
            "latency_ms": db_latency
        }
    except OperationalError:
        health_data["status"] = "unhealthy"
        health_data["services"]["database"] = {
            "status": "unhealthy",
            "latency_ms": None,
            "error": "Database connection failed"
        }
    
    # 2. Redis Cache Check
    cache_start = time.time()
    try:
        cache.set("health_ping", "pong", timeout=5)
        cache_result = cache.get("health_ping")

        if cache_result == "pong":
            cache_latency = round((time.time() - cache_start) * 1000, 2)
            health_data["services"]["cache"] = {
                "status": "healthy",
                "latency_ms": cache_latency
            }
        else:
            raise Exception("Cache write/read verification failed")
    except Exception as e:
        health_data["status"] = "unhealthy"
        health_data["services"]["cache"] = {
            "status": "unhealthy",
            "latency_ms": None,
            "error": str(e)
        }

    status_code = 200 if health_data["status"] == "healthy" else 503
    return Response(health_data, status=status_code)