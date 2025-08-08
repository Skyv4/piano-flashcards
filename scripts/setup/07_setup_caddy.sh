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
log_info "Configuring Caddy with snippets for ${NEXTAUTH_URL_PROD}..."

_CADDY_SNIPPETS_DIR="/etc/caddy/conf.d"
_MAIN_CADDYFILE_PATH="/etc/caddy/Caddyfile"

# Sanitize the domain name from NEXTAUTH_URL_PROD for use in the filename
# Remove protocol (e.g., https://)
_DOMAIN_NO_PROTOCOL=${NEXTAUTH_URL_PROD#*//}
# Remove trailing slash if it exists
_DOMAIN_NAME=${_DOMAIN_NO_PROTOCOL%/}
_PIANO_CONF_BASENAME="${_DOMAIN_NAME}.caddy"
_PIANO_CONF_PATH="${_CADDY_SNIPPETS_DIR}/${_PIANO_CONF_BASENAME}"

log_info "Ensuring Caddy snippets directory exists: ${_CADDY_SNIPPETS_DIR}"
if ! sudo mkdir -p "${_CADDY_SNIPPETS_DIR}"; then
    log_fatal "Failed to create Caddy snippets directory: ${_CADDY_SNIPPETS_DIR}"
fi
log_info "Caddy snippets directory ensured at ${_CADDY_SNIPPETS_DIR}."

# Define the main Caddyfile content to import snippets
_MAIN_CADDYFILE_CONTENT="import ${_CADDY_SNIPPETS_DIR}/*"

log_info "Writing main Caddyfile to ${_MAIN_CADDYFILE_PATH}..."
# Backup existing Caddyfile if it exists
if [ -f "${_MAIN_CADDYFILE_PATH}" ]; then
    log_info "Backing up existing Caddyfile to ${_MAIN_CADDYFILE_PATH}.bak..."
    if sudo cp "${_MAIN_CADDYFILE_PATH}" "${_MAIN_CADDYFILE_PATH}.bak"; then
        log_info "Backup created."
    else
        log_warning "Failed to create backup of Caddyfile. Continuing anyway."
    fi
fi

if ! (echo "$_MAIN_CADDYFILE_CONTENT" | sudo tee "${_MAIN_CADDYFILE_PATH}" > /dev/null); then
    log_fatal "Failed to write main Caddyfile to ${_MAIN_CADDYFILE_PATH}."
fi
log_info "Main Caddyfile configured at ${_MAIN_CADDYFILE_PATH} to import snippets from ${_CADDY_SNIPPETS_DIR}."

# Define the Caddyfile content for the piano app
log_info "Writing piano app Caddy configuration to ${_PIANO_CONF_PATH}..."
if ! sudo tee "${_PIANO_CONF_PATH}" > /dev/null <<EOF
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
    log_fatal "Failed to write piano app Caddy configuration to ${_PIANO_CONF_PATH}."
fi
log_info "Piano app Caddy configuration written to ${_PIANO_CONF_PATH}."


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

# --- 3. Enable and Reload Caddy Service ---
log_info "Enabling and reloading Caddy service..."
ensure_command_exists "systemctl"

if ! sudo systemctl enable --now caddy; then
    log_fatal "Failed to enable and start Caddy service."
fi
log_info "Caddy service enabled and started."

# Reload Caddy to apply the new configuration
# 'reload' is graceful and avoids downtime
log_info "Reloading Caddy configuration..."
if ! sudo systemctl reload caddy; then
    log_warning "Failed to reload Caddy. It might be the first time Caddy is starting, or an issue with the config. Check 'sudo systemctl status caddy'."
fi
log_info "Caddy configuration reload attempted."

echo ""
log_info "Caddy setup complete. ${NEXTAUTH_URL_PROD} should now be served by Caddy."
log_info "Ensure your Next.js application (service: ${SERVICE_NAME}) is running on localhost:${APP_PORT}."
log_info "DNS for ${NEXTAUTH_URL_PROD} must point to this server's public IP address."
log_info "Caddy will automatically provision an SSL certificate for ${NEXTAUTH_URL_PROD}."
log_info "You can check Caddy's status with: sudo systemctl status caddy"
log_info "And Caddy's logs with: journalctl -u caddy --no-pager | less +G"
log_info "Caddy Setup (07_setup_caddy.sh) finished."
