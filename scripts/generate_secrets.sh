#!/bin/bash
# scripts/generate_secrets.sh

# -----------------------------------------------------------------------------
# Generate Secrets File from Default Template
#
# This script generates the .secrets file from a .secrets.default template.
# It prompts the user to fill in sensitive information.
# -----------------------------------------------------------------------------

# Determine script's own directory to reliably source config
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/config.sh
source "${_SCRIPT_DIR}/lib/config.sh"

log_info() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] - $*"
}

log_warning() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] - $*" >&2
}

log_fatal() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [FATAL] - $*" >&2
    exit 1
}

log_info "Starting secrets file generation..."

# Define paths relative to PROJECT_ROOT_DIR (from config.sh)
DEFAULT_SECRETS_TEMPLATE="${APP_DIR}/.secrets.default"
TARGET_SECRETS_FILE="${APP_DIR}/${SOURCE_SECRETS_FILE_BASENAME}"

log_info "Looking for default secrets template at: ${DEFAULT_SECRETS_TEMPLATE}"
if [ ! -f "${DEFAULT_SECRETS_TEMPLATE}" ]; then
    log_fatal "Default secrets template not found at ${DEFAULT_SECRETS_TEMPLATE}. Cannot generate secrets file."
fi

log_info "Copying template to target secrets file: ${TARGET_SECRETS_FILE}"
if cp "${DEFAULT_SECRETS_TEMPLATE}" "${TARGET_SECRETS_FILE}"; then
    log_info "Template copied successfully."
else
    log_fatal "Failed to copy template to ${TARGET_SECRETS_FILE}."
fi

log_info "Updating DB_PASSWORD in ${TARGET_SECRETS_FILE} with value from config.sh..."
if sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" "${TARGET_SECRETS_FILE}"; then
    log_info "DB_PASSWORD updated."
else
    log_warning "Failed to update DB_PASSWORD in ${TARGET_SECRETS_FILE}. Please update it manually."
fi

log_info "Secrets file generated at ${TARGET_SECRETS_FILE}."
log_info "Please review and fill in any remaining sensitive information (e.g., NEXTAUTH_SECRET, DATABASE_URL) manually."
log_info "You can edit the file directly: nano ${TARGET_SECRETS_FILE}"
log_info "Generation complete."
