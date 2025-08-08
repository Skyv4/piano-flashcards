#!/bin/bash
# scripts/deploy.sh
set -e

# Determine script's own directory to reliably source config and common libs
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/config.sh
source "${_SCRIPT_DIR}/lib/config.sh"
# shellcheck source=lib/common.sh
source "${_SCRIPT_DIR}/lib/common.sh"

log_info "Starting deployment of TrainerApp..."

# --- Configuration (now mostly from config.sh) ---
# Variables like PROJECT_ROOT_DIR, APP_DIR, DEPLOY_TARGET_DIR,
# SYSTEM_USER, SYSTEM_GROUP, SERVICE_NAME, SERVICE_FILE_PATH, APP_PORT, NEXTAUTH_URL_PROD
# are now sourced from config.sh.

# Construct full paths for secrets files using basenames from config.sh
_SOURCE_SECRETS_FILE_FULL_PATH="${APP_DIR}/${SOURCE_SECRETS_FILE_BASENAME}"
_TARGET_SECRETS_FILE_FULL_PATH="${DEPLOY_TARGET_DIR}/${TARGET_SECRETS_FILE_BASENAME}"
_GENERATE_SECRETS_SCRIPT_FULL_PATH="${PROJECT_ROOT_DIR}/${GENERATE_SECRETS_SCRIPT_RELATIVE_PATH}"


# --- 0. Create Deployment Target Directory ---
log_info "Ensuring deployment target directory exists: ${DEPLOY_TARGET_DIR}"
if sudo mkdir -p "${DEPLOY_TARGET_DIR}"; then
    log_info "Deployment target directory ensured."
else
    log_fatal "Failed to create deployment target directory: ${DEPLOY_TARGET_DIR}"
fi
# Overall ownership of DEPLOY_TARGET_DIR will be set after rsync and build

# --- 1. Check and Prepare Secrets File (in source location) ---
log_info "Checking for secrets file in source: ${_SOURCE_SECRETS_FILE_FULL_PATH}"
if [ ! -f "${_SOURCE_SECRETS_FILE_FULL_PATH}" ]; then
    log_warning "Secrets file not found at ${_SOURCE_SECRETS_FILE_FULL_PATH}."
    if [ -f "${_GENERATE_SECRETS_SCRIPT_FULL_PATH}" ]; then
        log_info "Running ${_GENERATE_SECRETS_SCRIPT_FULL_PATH} to create it in source (${_SOURCE_SECRETS_FILE_FULL_PATH})..."
        ensure_command_exists "chmod"
        if ! chmod +x "${_GENERATE_SECRETS_SCRIPT_FULL_PATH}"; then
            log_fatal "Failed to make ${_GENERATE_SECRETS_SCRIPT_FULL_PATH} executable."
        fi
        # Run it (it will guide the user)
        if ! "${_GENERATE_SECRETS_SCRIPT_FULL_PATH}"; then
             log_fatal "${_GENERATE_SECRETS_SCRIPT_FULL_PATH} failed."
        fi
        
        echo "" # Keep this for spacing before read
        log_info "ACTION REQUIRED: The secrets file ${_SOURCE_SECRETS_FILE_FULL_PATH} was just (re)generated."
        log_info "Please ensure it contains all necessary production secrets (DATABASE_URL, verified NEXTAUTH_SECRET, etc.)."
        log_info "Deployment will pause. Press Enter to continue once secrets are configured, or Ctrl+C to abort."
        read -r
    else
        log_fatal "${_GENERATE_SECRETS_SCRIPT_FULL_PATH} not found. Cannot automatically create secrets file. Please create ${_SOURCE_SECRETS_FILE_FULL_PATH} manually with your production secrets."
    fi
else
    log_info "Secrets file found at ${_SOURCE_SECRETS_FILE_FULL_PATH}. Ensure it is up-to-date with production values."
fi

# --- 2. Synchronize Application Files to Deployment Directory ---
log_info "Synchronizing application files from ${APP_DIR} to ${DEPLOY_TARGET_DIR}..."
ensure_command_exists "rsync"
if sudo rsync -a --delete --checksum \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    "${APP_DIR}/" "${DEPLOY_TARGET_DIR}/"; then
    log_info "Application files synchronized to ${DEPLOY_TARGET_DIR}."
else
    log_fatal "Failed to synchronize application files."
fi

# --- 2.5 Set Permissions for Target Secrets File ---
log_info "Ensuring target secrets file ${_TARGET_SECRETS_FILE_FULL_PATH} has correct permissions..."
if [ -f "${_TARGET_SECRETS_FILE_FULL_PATH}" ]; then
    ensure_command_exists "chown"
    ensure_command_exists "chmod"
    if sudo chown "${SYSTEM_USER}:${SYSTEM_GROUP}" "${_TARGET_SECRETS_FILE_FULL_PATH}" && \
       sudo chmod 640 "${_TARGET_SECRETS_FILE_FULL_PATH}"; then # Owner (www-data) can rw, group (www-data) can r. Others no access.
        log_info "Permissions set for ${_TARGET_SECRETS_FILE_FULL_PATH}."
    else
        log_fatal "Failed to set permissions for ${_TARGET_SECRETS_FILE_FULL_PATH}."
    fi
else
    log_warning "Secrets file ${_TARGET_SECRETS_FILE_FULL_PATH} was not found after rsync."
    log_warning "This could happen if ${_SOURCE_SECRETS_FILE_FULL_PATH} did not exist or was empty."
    log_warning "The application might fail if secrets are required at runtime."
    # Consider: log_fatal "Secrets file is mandatory and not found." if absolutely required.
fi

# --- 3. Create/Update Systemd Service File ---
log_info "Creating/Updating systemd service file at ${SERVICE_FILE_PATH}..."
ensure_command_exists "tee"
# The service file will now point to DEPLOY_TARGET_DIR for WorkingDirectory
# and use the secrets file from DEPLOY_TARGET_DIR.
# It also uses APP_PORT and NEXTAUTH_URL_PROD from config.sh
# SERVICE_FILE_PATH is also from config.sh
if sudo tee "${SERVICE_FILE_PATH}" > /dev/null <<EOF
[Unit]
Description=${SERVICE_NAME} Next.js application
After=network.target

[Service]
User=${SYSTEM_USER}
Group=${SYSTEM_GROUP}
WorkingDirectory=${DEPLOY_TARGET_DIR}
ExecStart=/bin/bash -c 'source /var/www/.nvm/nvm.sh && pnpm start'

Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

Environment="NODE_ENV=production"
Environment="PORT=${APP_PORT}"
Environment="NEXTAUTH_URL=${NEXTAUTH_URL_PROD}"

# Load other environment variables (including secrets) from the .secrets file
EnvironmentFile=${_TARGET_SECRETS_FILE_FULL_PATH}

[Install]
WantedBy=multi-user.target
EOF
then
    log_info "Systemd service file created/updated at ${SERVICE_FILE_PATH}."
else
    log_fatal "Failed to write systemd service file to ${SERVICE_FILE_PATH}."
fi

# --- 4. Reload Systemd and Enable Service ---
log_info "Reloading systemd daemon..."
ensure_command_exists "systemctl"
if sudo systemctl daemon-reload; then
    log_info "Systemd daemon reloaded."
else
    log_fatal "Failed to reload systemd daemon."
fi

log_info "Enabling ${SERVICE_NAME}.service to start on boot..."
if sudo systemctl enable "${SERVICE_NAME}.service"; then
    log_info "${SERVICE_NAME}.service enabled."
else
    log_fatal "Failed to enable ${SERVICE_NAME}.service."
fi

# --- 5. Ensure pnpm is available for SYSTEM_USER via corepack ---
# This now calls the shared function from common.sh
# prepare_service_user_pnpm_environment sources necessary variables (SYSTEM_USER, etc.) from config.sh
prepare_service_user_pnpm_environment

# --- 6. Application Build (in DEPLOY_TARGET_DIR) ---
log_info "Navigating to deployment directory for build: ${DEPLOY_TARGET_DIR}"
if ! cd "${DEPLOY_TARGET_DIR}"; then
    log_fatal "Failed to navigate to ${DEPLOY_TARGET_DIR}."
fi

log_info "Installing/updating dependencies with pnpm in ${DEPLOY_TARGET_DIR}..."
ensure_command_exists "pnpm"
# Ensure pnpm is available. If using corepack, 'corepack enable' (run by user executing script)
# should make the pnpm shim active in the current shell.
if command -v corepack &> /dev/null; then
    log_info "Ensuring corepack pnpm shim is active for current user..."
    if ! corepack enable; then # Ensures pnpm shim is active for the user running the script
        log_warning "Failed to enable corepack for current user. pnpm might not be found."
    fi
fi

# Install all dependencies (including devDependencies) to ensure build tools like Prisma CLI are available
log_info "Installing all dependencies (including devDependencies) with pnpm in ${DEPLOY_TARGET_DIR}..."
if pnpm install --frozen-lockfile; then
    log_info "Dependencies installed."
else
    log_fatal "Failed to install dependencies in ${DEPLOY_TARGET_DIR}."
fi

log_info "Running Prisma Generate..."
if pnpm prisma generate; then
    log_info "Prisma Generate successful."
else
    log_fatal "Prisma Generate failed."
fi

log_info "Removing Next.js cache in ${DEPLOY_TARGET_DIR} (if any)..."
if rm -rf .next; then # Relative to current dir, which is DEPLOY_TARGET_DIR
    log_info "Next.js cache removed."
else
    log_warning "Failed to remove .next directory, or it didn't exist."
fi

log_info "Building Next.js application in ${DEPLOY_TARGET_DIR}..."
if pnpm next build .; then # Builds in current dir. Output (.next) owned by current user.
    log_info "Next.js application built."
else
    log_fatal "Next.js application build failed."
fi

# Prune devDependencies after build to keep the deployment artifact lean
log_info "Pruning devDependencies..."
if pnpm prune --prod; then
    log_info "DevDependencies pruned."
else
    log_fatal "Failed to prune devDependencies."
fi

# --- 7. Set Final Ownership and Permissions for Deployment Directory ---
# This now calls the shared function from common.sh
# It uses SYSTEM_USER and SYSTEM_GROUP from config.sh
set_target_ownership_and_permissions "${DEPLOY_TARGET_DIR}" "${SYSTEM_USER}" "${SYSTEM_GROUP}"

# --- 8. Restart Services ---
log_info "Restarting ${SERVICE_NAME} service..."
if sudo systemctl restart "${SERVICE_NAME}.service"; then
    log_info "${SERVICE_NAME}.service restarted."
else
    log_fatal "Failed to restart ${SERVICE_NAME}.service."
fi

log_info "Reloading Caddy (if used)..."
# Assuming Caddy is configured and needs reloading after backend restart/update.
if systemctl list-units --full -all | grep -q 'caddy.service'; then
    if sudo systemctl reload caddy; then
        log_info "Caddy reloaded."
    else
        log_warning "Failed to reload Caddy. Check Caddy status/logs."
    fi
else
    log_info "Caddy service not found, skipping reload."
fi

echo ""
log_info "--------------------------------------------------------------------"
log_info " Deployment complete!"
log_info "--------------------------------------------------------------------"
echo " Service Status:   sudo systemctl status ${SERVICE_NAME}.service"
echo " Service Logs:   journalctl -u ${SERVICE_NAME}.service -f"
echo ""
log_info " IMPORTANT REMINDERS:"
log_info " 1. Ensure your secrets file (${_TARGET_SECRETS_FILE_FULL_PATH}) is correctly populated"
log_info "    with all necessary production values (it was copied from ${_SOURCE_SECRETS_FILE_FULL_PATH})."
log_info " 2. The application is now running from ${DEPLOY_TARGET_DIR} as user ${SYSTEM_USER}."
log_info " 3. Your Caddy (or other reverse proxy) configuration should be proxying to localhost:${APP_PORT}."
log_info "--------------------------------------------------------------------"