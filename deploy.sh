#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Safe, Logged, Idempotent Deploy Script
# Fires Vercel + Render deploy hooks
# Safe to run multiple times — same result every time
# Completes in under 60 seconds
# =============================================================================

set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Logging functions ─────────────────────────────────────────────────────────
DEPLOY_LOG="/tmp/deploy_$(date +%Y%m%d_%H%M%S).log"

log()     { local msg="[$(date '+%H:%M:%S')] [INFO]  $*";  echo -e "${BLUE}${msg}${NC}";   echo "${msg}" >> "$DEPLOY_LOG"; }
ok()      { local msg="[$(date '+%H:%M:%S')] [OK]    $*";  echo -e "${GREEN}${msg}${NC}";  echo "${msg}" >> "$DEPLOY_LOG"; }
warn()    { local msg="[$(date '+%H:%M:%S')] [WARN]  $*";  echo -e "${YELLOW}${msg}${NC}"; echo "${msg}" >> "$DEPLOY_LOG"; }
fail()    { local msg="[$(date '+%H:%M:%S')] [ERROR] $*";  echo -e "${RED}${msg}${NC}";    echo "${msg}" >> "$DEPLOY_LOG"; exit 1; }
section() { local msg="[$(date '+%H:%M:%S')] ======= $* ======="; echo -e "${CYAN}${msg}${NC}"; echo "${msg}" >> "$DEPLOY_LOG"; }

# ── Timer ─────────────────────────────────────────────────────────────────────
START_TIME=$(date +%s)
elapsed() { echo $(( $(date +%s) - START_TIME )); }

# ── Safety check: prevent running if already running ─────────────────────────
LOCK_FILE="/tmp/deploy.lock"

if [ -f "$LOCK_FILE" ]; then
  LOCK_AGE=$(( $(date +%s) - $(date -r "$LOCK_FILE" +%s 2>/dev/null || echo 0) ))
  if [ "$LOCK_AGE" -lt 120 ]; then
    warn "Deploy already running (lock file is ${LOCK_AGE}s old). Skipping."
    warn "If this is wrong, delete /tmp/deploy.lock and retry."
    exit 0
  else
    warn "Stale lock file found (${LOCK_AGE}s old). Removing and continuing."
    rm -f "$LOCK_FILE"
  fi
fi

# Create lock file — removed automatically when script exits
touch "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"; log "Lock file removed."; log "Full log saved to: $DEPLOY_LOG"' EXIT

# ── Print header ──────────────────────────────────────────────────────────────
section "DEPLOY STARTED"
log "Timestamp : $(date '+%Y-%m-%d %H:%M:%S')"
log "Commit    : ${GITHUB_SHA:-local-run}"
log "Branch    : ${GITHUB_REF_NAME:-$(git branch --show-current 2>/dev/null || echo 'unknown')}"
log "Log file  : $DEPLOY_LOG"
log "Run by    : ${GITHUB_ACTOR:-$USER}"

# ── Step 1: Validate secrets ──────────────────────────────────────────────────
section "STEP 1/3 — Checking secrets"

MISSING=0

if [ -z "${VERCEL_DEPLOY_HOOK:-}" ]; then
  fail "VERCEL_DEPLOY_HOOK is not set. Add it to GitHub Secrets."
  MISSING=1
else
  ok "VERCEL_DEPLOY_HOOK is set"
fi

if [ -z "${RENDER_DEPLOY_HOOK:-}" ]; then
  fail "RENDER_DEPLOY_HOOK is not set. Add it to GitHub Secrets."
  MISSING=1
else
  ok "RENDER_DEPLOY_HOOK is set"
fi

[ "$MISSING" -eq 1 ] && fail "Missing secrets. Aborting deploy."

# ── Step 2: Fire Vercel hook (frontend) ───────────────────────────────────────
section "STEP 2/3 — Deploying frontend to Vercel"
log "Sending POST request to Vercel deploy hook..."

HTTP_STATUS=$(curl -s -o /tmp/vercel_response.txt -w "%{http_code}" \
  -X POST "${VERCEL_DEPLOY_HOOK}" \
  --max-time 30 \
  --retry 2 \
  --retry-delay 3 \
  2>> "$DEPLOY_LOG")

VERCEL_BODY=$(cat /tmp/vercel_response.txt 2>/dev/null || echo "no response")

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 300 ]; then
  ok "Vercel hook fired successfully (HTTP $HTTP_STATUS)"
  log "Response: ${VERCEL_BODY:0:100}"
else
  fail "Vercel hook failed (HTTP $HTTP_STATUS). Response: $VERCEL_BODY"
fi

# ── Step 3: Fire Render hook (backend) ───────────────────────────────────────
section "STEP 3/3 — Deploying backend to Render"
log "Sending POST request to Render deploy hook..."

HTTP_STATUS=$(curl -s -o /tmp/render_response.txt -w "%{http_code}" \
  -X POST "${RENDER_DEPLOY_HOOK}" \
  --max-time 30 \
  --retry 2 \
  --retry-delay 3 \
  2>> "$DEPLOY_LOG")

RENDER_BODY=$(cat /tmp/render_response.txt 2>/dev/null || echo "no response")

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 300 ]; then
  ok "Render hook fired successfully (HTTP $HTTP_STATUS)"
  log "Response: ${RENDER_BODY:0:100}"
else
  fail "Render hook failed (HTTP $HTTP_STATUS). Response: $RENDER_BODY"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
section "DEPLOY COMPLETE"
ok "Both platforms are rebuilding!"
ok "Total time: $(elapsed) seconds (limit: 60s)"
log ""
log "  Frontend → https://myapp-vivek1251.vercel.app"
log "  Backend  → https://myapp-backend-tmya.onrender.com"
log ""
log "Monitor progress:"
log "  Vercel  → vercel.com/dashboard"
log "  Render  → dashboard.render.com"
