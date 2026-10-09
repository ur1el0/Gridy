#!/bin/bash
set -e

# Default to production Gunicorn server if no command is supplied
if [ "$#" -eq 0 ]; then
    set -- gunicorn config.wsgi.application --bind 0.0.0.0:8000 --workers 3
fi

# Run database migrations on container launch
if [[ "$*" == *"runserver"* ]] || [[ "$*" == *"gunicorn"* ]]; then
    echo "Running Database Migrations..."
    python manage.py migrate --noinput
fi

echo "Starting Server: $@"
exec "$@"
