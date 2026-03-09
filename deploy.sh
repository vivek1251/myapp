#!/usr/bin/env bash
# deploy.sh — fires Vercel + Render deploy hooks
# Run automatically by GitHub Actions on every push to main

set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'

log()  { echo -e "${BLUE}[deploy]${NC} $*"; }
ok()   { echo -e "${GREEN}[deploy] ✔ $*${NC}"; }
fail() { echo -e "${RED}[deploy] ✘ $*${NC}"; exit 1; }

log "Starting deploy — commit: ${GITHUB_SHA:-local}"

# Check secrets exist
[[ -z "${VERCEL_DEPLOY_HOOK:-}" ]] && fail "VERCEL_DEPLOY_HOOK secret is missing"
[[ -z "${RENDER_DEPLOY_HOOK:-}" ]] && fail "RENDER_DEPLOY_HOOK secret is missing"

# Fire Vercel (frontend)
log "Triggering Vercel frontend deploy..."
curl -sf -X POST "${VERCEL_DEPLOY_HOOK}" --max-time 30 > /dev/null \
  || fail "Vercel hook failed — check VERCEL_DEPLOY_HOOK in GitHub Secrets"
ok "Vercel deploy triggered"

# Fire Render (backend)
log "Triggering Render backend deploy..."
curl -sf -X POST "${RENDER_DEPLOY_HOOK}" --max-time 30 > /dev/null \
  || fail "Render hook failed — check RENDER_DEPLOY_HOOK in GitHub Secrets"
ok "Render deploy triggered"

ok "Both deploys fired! Check dashboards:"
log "  Frontend → vercel.com/dashboard"
log "  Backend  → dashboard.render.com"
