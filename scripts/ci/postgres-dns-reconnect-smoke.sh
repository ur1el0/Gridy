#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "$BASH_SOURCE")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/scripts/ci/postgres-dns-reconnect.compose.yml"
PROJECT_NAME="m48-dns-$(date +%s)-$$"
NETWORK_NAME="$PROJECT_NAME"_dns
PRIMARY_IP="10.253.240.10"
FAILOVER_IP="10.253.240.11"
STARTED=0

cd "$ROOT_DIR"

fail() {
  printf 'PostgreSQL DNS reconnect smoke failed: %s\n' "$1" >&2
  exit 1
}

compose() {
  docker compose --env-file /dev/null --project-name "$PROJECT_NAME" \
    --file "$COMPOSE_FILE" "$@"
}

probe_request() {
  compose exec -T probe python tests/postgres_dns_reconnect_probe.py request
}

probe_status() {
  python3 -c 'import json,sys; print(json.loads(sys.argv[1])["http_status"])' "$1"
}

probe_address() {
  python3 -c 'import json,sys; print(json.loads(sys.argv[1])["payload"].get("server_address", ""))' "$1"
}

cleanup() {
  local result=$?
  trap - EXIT

  if (( STARTED )); then
    if ! compose down --remove-orphans >/dev/null 2>&1; then
      printf 'Compose cleanup failed for project %s.\n' "$PROJECT_NAME" >&2
      (( result != 0 )) || result=1
    fi
  fi

  exit "$result"
}

docker info --format '{{.ServerVersion}}' >/dev/null \
  || fail "Docker daemon is unavailable"

trap cleanup EXIT
STARTED=1

printf 'Starting isolated PostgreSQL DNS reconnect project %s.\n' "$PROJECT_NAME"
compose up --detach --build db_primary db_failover probe

failover_ready=0
for _ in $(seq 1 60); do
  if compose exec -T db_failover pg_isready -U m48_probe -d m48_probe >/dev/null 2>&1; then
    failover_ready=1
    break
  fi
  sleep 1
done
(( failover_ready == 1 )) || fail "disposable failover database did not become ready"

initial_response=""
for _ in $(seq 1 60); do
  if initial_response="$(probe_request 2>/dev/null)" \
    && [[ "$(probe_status "$initial_response")" == "200" ]]; then
    break
  fi
  sleep 1
done
[[ -n "$initial_response" ]] || fail "Django probe did not return an initial response"

initial_status="$(probe_status "$initial_response")"
initial_address="$(probe_address "$initial_response")"
[[ "$initial_status" == "200" ]] || fail "initial probe returned HTTP $initial_status"
[[ "$initial_address" == "$PRIMARY_IP" ]] \
  || fail "initial probe reached $initial_address instead of primary $PRIMARY_IP"
printf 'Initial Django connection reached primary database %s.\n' "$initial_address"

primary_id="$(compose ps --quiet db_primary)"
failover_id="$(compose ps --quiet db_failover)"
[[ -n "$primary_id" && -n "$failover_id" ]] || fail "database container IDs were not found"

docker kill "$primary_id" >/dev/null
docker network disconnect "$NETWORK_NAME" "$primary_id"
docker network connect --ip "$FAILOVER_IP" --alias db "$NETWORK_NAME" "$failover_id"
sleep 1

interrupted_response="$(probe_request)" \
  || fail "probe client could not reach the persistent Django server after the database switch"
interrupted_status="$(probe_status "$interrupted_response")"
[[ "$interrupted_status" == "503" ]] \
  || fail "first probe after interruption returned HTTP $interrupted_status instead of 503"
printf 'Interrupted database connection returned HTTP 503 as expected.\n'

reconnected_response=""
for _ in $(seq 1 30); do
  if reconnected_response="$(probe_request 2>/dev/null)" \
    && [[ "$(probe_status "$reconnected_response")" == "200" ]]; then
    break
  fi
  sleep 1
done
[[ -n "$reconnected_response" ]] || fail "Django did not reconnect to the failover database"

reconnected_address="$(probe_address "$reconnected_response")"
[[ "$reconnected_address" == "$FAILOVER_IP" ]] \
  || fail "reconnected probe reached $reconnected_address instead of failover $FAILOVER_IP"
[[ "$reconnected_address" != "$initial_address" ]] \
  || fail "database server address did not change after DNS reassignment"

printf 'Subsequent Django connection reached failover database %s through the reassigned DNS alias.\n' \
  "$reconnected_address"
