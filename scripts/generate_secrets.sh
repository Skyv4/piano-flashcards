#!/bin/bash
# scripts/generate_secrets.sh

# -----------------------------------------------------------------------------
# Generate Local Environment File
#
# This script generates the .env.local file from the .env.example template
# for local development purposes.
# -----------------------------------------------------------------------------

# Determine script's own directory to reliably source config
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/config.sh
source "${_SCRIPT_DIR}/lib/config.sh"
# shellcheck source=lib/common.sh
source "${_SCRIPT_DIR}/lib/common.sh"

log_info "Starting local environment file generation..."

# Paths are now defined in config.sh (e.g., ENV_EXAMPLE_FILE, ENV_LOCAL_FILE)

log_info "Looking for environment template at: ${ENV_EXAMPLE_FILE}"
if [ ! -f "${ENV_EXAMPLE_FILE}" ]; then
    log_fatal "Environment template not found at ${ENV_EXAMPLE_FILE}. Cannot generate .env.local file."
fi

log_info "Copying template to target local environment file: ${ENV_LOCAL_FILE}"
if cp "${ENV_EXAMPLE_FILE}" "${ENV_LOCAL_FILE}"; then
    log_info "Template copied successfully."
else
    log_fatal "Failed to copy template to ${ENV_LOCAL_FILE}."
fi

# Construct the DATABASE_URL from individual DB components in config.sh
_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

log_info "Updating DATABASE_URL in ${ENV_LOCAL_FILE}..."
# Use sed to replace the placeholder DATABASE_URL. The `|` is used as a separator
# to avoid issues with the slashes in the URL.
if sed -i "s|DATABASE_URL=.*|DATABASE_URL=${_DATABASE_URL}|" "${ENV_LOCAL_FILE}"; then
    log_info "DATABASE_URL updated."
else
    log_warning "Failed to update DATABASE_URL in ${ENV_LOCAL_FILE}. Please update it manually."
fi

# Generate a NEXTAUTH_SECRET if one isn't already set
_NEXTAUTH_SECRET=$(openssl rand -hex 32)
log_info "Updating NEXTAUTH_SECRET in ${ENV_LOCAL_FILE}..."
if sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=${_NEXTAUTH_SECRET}|" "${ENV_LOCAL_FILE}"; then
    log_info "NEXTAUTH_SECRET updated with a newly generated secret."
else
    log_warning "Failed to update NEXTAUTH_SECRET in ${ENV_LOCAL_FILE}. Please update it manually."
fi


log_info "Local environment file generated at ${ENV_LOCAL_FILE}."
log_info "Please review the file and ensure all values are correct for your local setup."
log_info "You can edit the file directly: nano ${ENV_LOCAL_FILE}"
log_info "Generation complete."