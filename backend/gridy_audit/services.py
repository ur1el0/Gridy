from .models import AuditLog

def get_client_ip(request):
    """
    Helper function to extract client's real IP address from HTTP headers,
    supporting load balancers to proxy routes (HTTP_X_FORWARDED_FOR).
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # Extract the first IP in the comma-separated list representing the original client

        ip = x_forwarded_for.split(',')[0].strip()
    else:
        # Fallback to direct client connection IP
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_action(user, action_type, description, request=None):
    """
    Writes a security/administrative action history record to the database
    """
    ip_address = None
    if request:
        ip_address = get_client_ip(request)

    return AuditLog.objects.create(
        action_by=user,
        action_type=action_type,
        description=description,
        ip_address=ip_address
    )