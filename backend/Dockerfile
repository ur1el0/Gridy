# Use official lightweight Python image
FROM python:3.12-slim

# Prevent Python from buffering stdout and writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN groupadd --system app && useradd --system --gid app --create-home app

# Install system dependencies required for PostgreSQL (psycop2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python packages
COPY --chown=app:app requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of our Django project
COPY --chown=app:app . .

# Ensure entrypoint is executable
RUN chmod +x entrypoint.sh && mkdir -p /app/media && chown app:app /app/media

USER app

# Expose the API port
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health/', timeout=4)" || exit 1

# Set the entrypoint script
ENTRYPOINT [ "./entrypoint.sh" ]

# Default startup command for container execution
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
