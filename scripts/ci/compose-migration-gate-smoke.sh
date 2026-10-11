#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
PROJECT_NAME="m44-gate-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}-$$"
RUN_TMP_DIR="${TMPDIR:-/tmp}"
OVERRIDE_FILE=""
ROOT_ENV_CREATED=0
BACKEND_ENV_CREATED=0

cd "$ROOT_DIR"

fail() {
  printf 'Compose migration smoke failed: %s\n' "$1" >&2
  exit 1
}

compose() {
  docker compose --project-name "$PROJECT_NAME" --file "$COMPOSE_FILE" "$@"
}

compose_with_failure_override() {
  docker compose --project-name "$PROJECT_NAME" \
    --file "$COMPOSE_FILE" --file "$OVERRIDE_FILE" "$@"
}

cleanup() {
  local result=$?
  trap - EXIT

  if (( ROOT_ENV_CREATED || BACKEND_ENV_CREATED )); then
    if ! compose down --volumes --remove-orphans >/dev/null 2>&1; then
      printf 'Compose cleanup failed for project %s.\n' "$PROJECT_NAME" >&2
      (( result != 0 )) || result=1
    fi
  fi

  if (( ROOT_ENV_CREATED )); then
    rm -f -- "$ROOT_DIR/.env"
  fi
  if (( BACKEND_ENV_CREATED )); then
    rm -f -- "$ROOT_DIR/backend/.env"
  fi
  if [[ -n "$OVERRIDE_FILE" ]]; then
    rm -f -- "$OVERRIDE_FILE"
  fi

  exit "$result"
}

for env_path in "$ROOT_DIR/.env" "$ROOT_DIR/backend/.env"; do
  if [[ -e "$env_path" || -L "$env_path" ]]; then
    fail "refusing to overwrite existing environment file: ${env_path#"$ROOT_DIR"/}"
  fi
done

for container_name in gridy_db gridy_backend gridy_frontend; do
  if docker container inspect "$container_name" >/dev/null 2>&1; then
    fail "refusing to run while fixed Compose container '$container_name' exists"
  fi
done

docker info --format '{{.ServerVersion}}' >/dev/null \
  || fail "Docker daemon is unavailable"

trap cleanup EXIT
umask 077

ROOT_ENV_CREATED=1
cat > "$ROOT_DIR/.env" <<'ENV_EOF'
POSTGRES_PASSWORD=m44-ci-only-local-password
ENV_EOF

BACKEND_ENV_CREATED=1
cat > "$ROOT_DIR/backend/.env" <<'ENV_EOF'
SECRET_KEY=m44-local-compose-smoke-key
DEBUG=True
ADMIN_REGISTRATION_PASSKEY=m44-local-compose-smoke-passkey
DATABASE_URL=postgres://gridy_user:m44-ci-only-local-password@db:5432/gridy_db
ENV_EOF

OVERRIDE_FILE="$(mktemp "$RUN_TMP_DIR/m44-compose-failed-migration.XXXXXX.yml")"
cat > "$OVERRIDE_FILE" <<'YAML_EOF'
services:
  migrate:
    command: ["python", "-c", "raise SystemExit(42)"]
YAML_EOF

printf 'Running successful migration gate in disposable Compose project %s.\n' "$PROJECT_NAME"
compose up --detach --build backend

migrate_id="$(compose ps --all --quiet migrate | head -n 1)"
[[ -n "$migrate_id" ]] || fail "successful migration container was not created"
migrate_exit="$(docker inspect --format '{{.State.ExitCode}}' "$migrate_id")"
[[ "$migrate_exit" == "0" ]] || fail "successful migration exited with code $migrate_exit"

health_url="http://127.0.0.1:8000/api/v1/health/"
health_ok=0
for _ in $(seq 1 60); do
  if curl --fail --silent --show-error "$health_url" >/dev/null 2>&1; then
    health_ok=1
    break
  fi
  sleep 2
done
if (( health_ok == 0 )); then
  compose logs --no-color backend >&2 || true
  fail "backend health endpoint did not return HTTP 200 after migration"
fi
printf 'Successful migration exited 0 and API health returned HTTP 200.\n'

compose down --volumes --remove-orphans

printf 'Running failed migration gate in the same disposable Compose project.\n'
if compose_with_failure_override up --detach backend; then
  fail "Compose unexpectedly succeeded when the migration command exited 42"
fi

migrate_id="$(compose_with_failure_override ps --all --quiet migrate | head -n 1)"
[[ -n "$migrate_id" ]] || fail "failing migration container was not created"
migrate_exit="$(docker inspect --format '{{.State.ExitCode}}' "$migrate_id")"
[[ "$migrate_exit" == "42" ]] || fail "failing migration exited with code $migrate_exit instead of 42"

backend_id="$(compose_with_failure_override ps --quiet backend)"
[[ -z "$backend_id" ]] || fail "backend started despite failed migration"
printf 'Failed migration exited 42 and backend did not start.\n'
