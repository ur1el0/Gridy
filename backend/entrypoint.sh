#!/bin/bash
set -e

echo "Running Database Migrations..."
python manage.py migrate --noinput

echo "Starting Django Server..."
# Execute the main command passed from docker-compose
exec "$@"
