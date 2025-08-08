#!/bin/bash
# scripts/setup/06_setup_caddy.sh

# -----------------------------------------------------------------------------
# Caddy Setup Script
#
# This script installs Caddy, configures it as a reverse proxy for the
# application, and ensures it starts on boot.
# -----------------------------------------------------------------------------

set -e

# Determine script's own directory to reliably source config and common libs
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib/config.sh
source "${_SCRIPT_DIR}/../lib/config.sh"
# shellcheck source=../lib/common.sh
source "${_SCRIPT_DIR}/../lib/common.sh"

log_info "Starting Caddy setup..."

# --- 1. Install Caddy ---
log_info "Installing Caddy..."
ensure_command_exists "sudo"
ensure_command_exists "apt-get"
ensure_command_exists "curl"

# Add Caddy's GPG key
if curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg; then
    log_info "Caddy GPG key added."
else
    log_fatal "Failed to add Caddy GPG key."
fi

# Add Caddy's APT repository
if curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list; then
    log_info "Caddy APT repository added."
else
    log_fatal "Failed to add Caddy APT repository."
fi

# Update apt cache and install Caddy
if sudo apt-get update && sudo apt-get install -y caddy; then
    log_info "Caddy installed."
else
    log_fatal "Failed to install Caddy."
fi

# --- 2. Configure Caddyfile ---
log_info "Configuring Caddyfile for ${NEXTAUTH_URL_PROD}..."

CADDYFILE_PATH="/etc/caddy/Caddyfile"

# Backup existing Caddyfile if it exists
if [ -f "${CADDYFILE_PATH}" ]; then
    log_info "Backing up existing Caddyfile to ${CADDYFILE_PATH}.bak..."
    if sudo cp "${CADDYFILE_PATH}" "${CADDYFILE_PATH}.bak"; then
        log_info "Backup created."
    else
        log_warning "Failed to create backup of Caddyfile. Continuing anyway."
    fi
fi

# Write the new Caddyfile content
# This assumes a simple reverse proxy setup. Adjust as needed for more complex configs.
if sudo tee "${CADDYFILE_PATH}" > /dev/null <<EOF
${NEXTAUTH_URL_PROD} {
    reverse_proxy localhost:${APP_PORT}

    # Optional: Enable gzip compression
    encode gzip

    # Optional: Logging
    log {
        output file /var/log/caddy/${SERVICE_NAME}_access.log
        format console
    }

    # Optional: Error pages
    handle_errors {
        rewrite * /500.html
        file_server {
            root /var/www/html
        }
    }
}
EOF
then
    log_info "Caddyfile configured at ${CADDYFILE_PATH}."
else
    log_fatal "Failed to write Caddyfile to ${CADDYFILE_PATH}."
fi

# Ensure Caddy log directory exists and has correct permissions
LOG_DIR="/var/log/caddy"
if sudo mkdir -p "${LOG_DIR}"; then
    log_info "Caddy log directory ensured."
else
    log_fatal "Failed to create Caddy log directory: ${LOG_DIR}"
fi

# Caddy runs as user 'caddy', group 'caddy' by default
if sudo chown -R caddy:caddy "${LOG_DIR}"; then
    log_info "Ownership of ${LOG_DIR} set to caddy:caddy."
else
    log_warning "Failed to set ownership for ${LOG_DIR}. Caddy might have issues writing logs."
fi

# --- 3. Enable and Start Caddy Service ---
log_info "Enabling and starting Caddy service..."
ensure_command_exists "systemctl"
if sudo systemctl enable caddy && sudo systemctl restart caddy; then
    log_info "Caddy service enabled and started."
else
    log_fatal "Failed to enable and start Caddy service."
fi

log_info "Caddy setup complete."
