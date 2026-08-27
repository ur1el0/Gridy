# Use official lightweight Python image
FROM python:3.12-slim

# Prevent Python from buffering stdout and writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required for PostgreSQL (psycop2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \ 
    && rm -rf /var/lib/apt/lists/*

# Install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of our Django project
COPY . .

# Ensure entrypoint is executable
RUN chmod +x entrypoint.sh

# Expose the API port
EXPOSE 8000

# Set the entrypoint script
ENTRYPOINT [ "./entrypoint.sh" ]

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]