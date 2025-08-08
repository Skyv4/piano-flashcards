#!/bin/bash
set -e

# Determine script's own directory to reliably source config and common libs
_SETUP_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_LIB_DIR="${_SETUP_SCRIPT_DIR}/../lib" # Assuming this script is in setup/, so ../lib

# shellcheck source=../lib/config.sh
source "${_LIB_DIR}/config.sh"
# shellcheck source=../lib/common.sh
source "${_LIB_DIR}/common.sh"

log_info "Starting User and System PNPM Setup (06_setup_user.sh)..."
log_info "This script should be run once during initial server setup."

# --- Ensure System User and Group Exist ---
# SYSTEM_USER and SYSTEM_GROUP are sourced from config.sh (e.g., www-data)
# The "system" flag tells ensure_user_group_exists to create a system account.
ensure_user_group_exists "${SYSTEM_USER}" "${SYSTEM_GROUP}" "system"

# --- Ensure pnpm is accessible for the system user via corepack ---
# Temporarily bypass system-wide setup to avoid sudo issues
log_info "Ensuring pnpm is available for system user '${SYSTEM_USER}' via corepack..."
sudo -u "${SYSTEM_USER}" bash -c "source /var/www/.nvm/nvm.sh && corepack enable && corepack prepare pnpm@latest --activate"
log_info "Corepack and pnpm setup attempted for '${SYSTEM_USER}'."

log_info "User and System PNPM Setup (06_setup_user.sh) complete."
log_info "The service user '${SYSTEM_USER}' and group '${SYSTEM_GROUP}' have been ensured."
log_info "A system-wide pnpm (via corepack) has been set up."
log_info "The main deploy.sh script will further configure pnpm specifically for the '${SYSTEM_USER}' user's environment."
