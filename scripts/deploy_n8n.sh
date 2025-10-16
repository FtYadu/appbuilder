#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: deploy_n8n.sh --domain DOMAIN --subdomain SUBDOMAIN [options]

Required arguments:
  --domain DOMAIN         Base domain (e.g. example.com)
  --subdomain SUBDOMAIN   Subdomain for n8n (e.g. automation)

Optional arguments:
  --app-dir PATH          Installation directory (default: /opt/n8n)
  --timezone TZ           Timezone for containers (default: Asia/Dubai)
  --force                 Overwrite existing configuration files
  --skip-health-check     Do not run the post-deploy curl probe
  -h, --help              Show this help message and exit
USAGE
}

log() {
  printf '[%s] %s\n' "$(date -Is)" "$*"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' not found in PATH" >&2
    exit 1
  fi
}

check_docker_compose() {
  if ! docker compose version >/dev/null 2>&1; then
    echo "Error: 'docker compose' is not available. Install Docker Compose v2." >&2
    exit 1
  fi
}

DOMAIN=""
SUBDOMAIN=""
APP_DIR="/opt/n8n"
TIMEZONE="Asia/Dubai"
FORCE=0
SKIP_HEALTH_CHECK=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN="$2"
      shift 2
      ;;
    --subdomain)
      SUBDOMAIN="$2"
      shift 2
      ;;
    --app-dir)
      APP_DIR="$2"
      shift 2
      ;;
    --timezone)
      TIMEZONE="$2"
      shift 2
      ;;
    --force)
      FORCE=1
      shift
      ;;
    --skip-health-check)
      SKIP_HEALTH_CHECK=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$DOMAIN" || -z "$SUBDOMAIN" ]]; then
  echo "Error: --domain and --subdomain are required" >&2
  usage
  exit 1
fi

FQDN="${SUBDOMAIN}.${DOMAIN}"

require_command openssl
require_command curl
require_command tr
require_command grep
require_command cut
check_docker_compose

USER_NAME="$(id -un)"
GROUP_NAME="$(id -gn)"

if [[ $EUID -ne 0 ]]; then
  SUDO="sudo"
else
  SUDO=""
fi

log "Ensuring application directory $APP_DIR exists"
if [[ -n "$SUDO" ]]; then
  $SUDO mkdir -p "$APP_DIR"
  $SUDO chown -R "$USER_NAME:$GROUP_NAME" "$APP_DIR"
else
  mkdir -p "$APP_DIR"
fi

cd "$APP_DIR"

if [[ ! -f .n8n_key ]]; then
  log "Generating encryption key"
  openssl rand -base64 48 > .n8n_key
fi
N8N_KEY="$(tr -d '\n' < .n8n_key)"

ENV_FILE=".env"
DB_PASSWORD=""
if [[ -f "$ENV_FILE" ]]; then
  DB_PASSWORD="$(grep '^DB_POSTGRESDB_PASSWORD=' "$ENV_FILE" | tail -n1 | cut -d'=' -f2- || true)"
  if [[ $FORCE -eq 0 ]]; then
    log "Existing .env detected; values will be updated in-place"
  fi
fi
if [[ -z "$DB_PASSWORD" || $FORCE -eq 1 ]]; then
  DB_PASSWORD="$(openssl rand -base64 24 | tr -d '\n')"
fi

if [[ -f "$ENV_FILE" ]]; then
  BACKUP_FILE="$ENV_FILE.backup.$(date +%s)"
  cp "$ENV_FILE" "$BACKUP_FILE"
  log "Backed up existing .env to $BACKUP_FILE"
fi

cat > "$ENV_FILE" <<ENV
# --- n8n core ---
N8N_HOST=${FQDN}
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://${FQDN}/
N8N_EDITOR_BASE_URL=https://${FQDN}/
N8N_SECURE_COOKIE=true
N8N_ENCRYPTION_KEY=${N8N_KEY}
TZ=${TIMEZONE}

# --- database ---
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}

# --- hygiene ---
N8N_DIAGNOSTICS_ENABLED=false
N8N_PERSONALIZATION_ENABLED=false
N8N_METRICS=false
ENV

COMPOSE_FILE="docker-compose.yml"
if [[ -f "$COMPOSE_FILE" ]]; then
  BACKUP_COMPOSE="$COMPOSE_FILE.backup.$(date +%s)"
  cp "$COMPOSE_FILE" "$BACKUP_COMPOSE"
  log "Backed up existing docker-compose.yml to $BACKUP_COMPOSE"
fi

cat > "$COMPOSE_FILE" <<'YAML'
services:
  postgres:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_POSTGRESDB_DATABASE}
      POSTGRES_USER: ${DB_POSTGRESDB_USER}
      POSTGRES_PASSWORD: ${DB_POSTGRESDB_PASSWORD}
      TZ: ${TZ}
    volumes:
      - n8n_pg:/var/lib/postgresql/data

  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    restart: unless-stopped
    depends_on:
      - postgres
    env_file:
      - .env
    ports:
      - "127.0.0.1:5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_pg:
  n8n_data:
YAML

log "Pulling container images"
docker compose pull
log "Starting containers"
docker compose up -d

if [[ $SKIP_HEALTH_CHECK -eq 0 ]]; then
  log "Waiting for n8n to respond on 127.0.0.1:5678"
  for i in {1..30}; do
    if curl -fsS http://127.0.0.1:5678 >/dev/null 2>&1; then
      log "n8n is listening on 127.0.0.1:5678"
      break
    fi
    sleep 2
    if [[ $i -eq 30 ]]; then
      echo "Warning: timed out waiting for n8n to become ready" >&2
      exit 1
    fi
  done
else
  log "Skipping health check as requested"
fi

cat <<SUMMARY
Deployment complete!

Next steps:
  1. Create a DNS A record for ${FQDN} pointing to this server.
  2. Issue a Let's Encrypt certificate for ${FQDN} via Webuzo.
  3. Configure the Webuzo reverse proxy to forward HTTPS to 127.0.0.1:5678.
SUMMARY
