from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import connection
from django.core.cache import cache
import time
import logging
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiTypes
from config.celery import app as celery_app

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Check System Health Telemetry",
        description="Verify backend database and cache connectivity and measure execution latencies.",
        responses={200: OpenApiTypes.OBJECT, 503: OpenApiTypes.OBJECT}
    )
    def get(self, request, *args, **kwargs):
        status_info = {
            "status": "healthy",
            "timestamp": timezone.now().isoformat(),
            "services": {}
        }
        overall_healthy = True

        # 1. Check Database Connection & Latency
        try:
            start_time = time.time()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
            db_latency = (time.time() - start_time) * 1000
            status_info["services"]["database"] = {
                "status": "healthy",
                "latency_ms": round(db_latency, 2)
            }
        except Exception as e:
            overall_healthy = False
            logger.exception("Database health check failed")
            status_info["services"]["database"] = {
                "status": "unhealthy",
                "error": "Database connectivity check failed."
            }

        # 2. Check Redis Cache Connection & Latency
        try: 
            start_time = time.time()
            cache.set("health_check_dummy", "ok", timeout=5)
            val = cache.get("health_check_dummy")
            if val != "ok":
                raise ValueError("Cache verification mismatch.")
            cache_latency = (time.time() - start_time) * 1000
            status_info["services"]["cache"] = {
                "status": "healthy",
                "latency_ms": round(cache_latency, 2)
            }
        except Exception as e:
            overall_healthy = False
            logger.exception("Cache health check failed")
            status_info["services"]["cache"] = {
                "status": "unhealthy",
                "error": "Cache connectivity check failed."
            }
        if not overall_healthy:
            status_info["status"] = "unhealthy"
            return Response(status_info, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            start_time = time.time()
            # Pings the workers and waits up to 1 second
            ping_result = celery_app.control.ping(timeout=1.0)

            if not ping_result:
                raise ValueError("No Celery workers responded to ping.")

            celery_latency = (time.time() - start_time) * 1000
            status_info["services"]["celery"] = {
                "status": "healthy",
                "latency_ms": round(celery_latency, 2),
                "workers_alive": len(ping_result)
            }
        except Exception as e:
            overall_healthy = False
            logger.exception("Celery health check failed")
            status_info["services"]["celery"] = {
                "status": "unhealthy",
                "error": "Celery worker check failed."
            }   

        return Response(status_info, status=status.HTTP_200_OK)