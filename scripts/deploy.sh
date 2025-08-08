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

# Construct full paths for environment files using variables from config.sh
_SOURCE_PROD_ENV_FILE="${PROJECT_ROOT_DIR}/.env.production"
_TARGET_ENV_FILE="${DEPLOY_TARGET_DIR}/${DEPLOY_ENV_FILE_BASENAME}"
_GENERATE_ENV_SCRIPT_FULL_PATH="${PROJECT_ROOT_DIR}/${GENERATE_ENV_SCRIPT_RELATIVE_PATH}"


# --- 0. Create Deployment Target Directory ---
log_info "Ensuring deployment target directory exists: ${DEPLOY_TARGET_DIR}"
if ${SUDO} mkdir -p "${DEPLOY_TARGET_DIR}"; then
    log_info "Deployment target directory ensured."
else
    log_fatal "Failed to create deployment target directory: ${DEPLOY_TARGET_DIR}"
fi
# Overall ownership of DEPLOY_TARGET_DIR will be set after rsync and build

# --- 1. Check for Production Environment File ---
log_info "Checking for production environment file at: ${_SOURCE_PROD_ENV_FILE}"
if [ ! -f "${_SOURCE_PROD_ENV_FILE}" ]; then
    log_fatal "Production environment file not found at ${_SOURCE_PROD_ENV_FILE}".
    log_fatal "Please create this file with your production secrets (DATABASE_URL, NEXTAUTH_SECRET, etc.)."
    log_fatal "You can use .env.example as a template."
    # The script will exit here due to log_fatal
fi
log_info "Production environment file found. Ensure it is up-to-date with production values."

# --- 2. Synchronize Application Files to Deployment Directory ---
log_info "Synchronizing application files from ${PROJECT_ROOT_DIR} to ${DEPLOY_TARGET_DIR}..."
ensure_command_exists "rsync"
# Note: We explicitly include the .env.production file and then rename it post-sync.
# Or, we can copy it separately. Let's copy it separately for clarity.
if ${SUDO} rsync -a --delete --checksum \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude '.env*' \
    --exclude 'src/app/.secrets*' \
    "${PROJECT_ROOT_DIR}/" "${DEPLOY_TARGET_DIR}/"; then
    log_info "Application files synchronized to ${DEPLOY_TARGET_DIR}."
else
    log_fatal "Failed to synchronize application files."
fi

# --- 2.5 Copy and Set Permissions for Target Environment File ---
log_info "Copying production environment file to deployment target..."
if ${SUDO} cp "${_SOURCE_PROD_ENV_FILE}" "${_TARGET_ENV_FILE}"; then
    log_info "Copied ${_SOURCE_PROD_ENV_FILE} to ${_TARGET_ENV_FILE}".
else
    log_fatal "Failed to copy environment file to deployment target."
fi

log_info "Ensuring target environment file ${_TARGET_ENV_FILE} has correct permissions..."
ensure_command_exists "chown"
ensure_command_exists "chmod"
if ${SUDO} chown "${SYSTEM_USER}:${SYSTEM_GROUP}" "${_TARGET_ENV_FILE}" && \
   ${SUDO} chmod 640 "${_TARGET_ENV_FILE}"; then # Owner (www-data) can rw, group (www-data) can r. Others no access.
    log_info "Permissions set for ${_TARGET_ENV_FILE}".
else
    log_fatal "Failed to set permissions for ${_TARGET_ENV_FILE}".
fi


# --- 3. Create/Update Systemd Service File ---
log_info "Creating/Updating systemd service file at ${SERVICE_FILE_PATH}..."
ensure_command_exists "tee"
# The service file will now point to DEPLOY_TARGET_DIR for WorkingDirectory.
# Next.js will automatically load the .env file from the working directory.
if ${SUDO} tee "${SERVICE_FILE_PATH}" > /dev/null <<EOF
[Unit]
Description=${SERVICE_NAME} Next.js application
After=network.target

[Service]
User=${SYSTEM_USER}
Group=${SYSTEM_GROUP}
WorkingDirectory=${DEPLOY_TARGET_DIR}
ExecStart=/bin/bash -c 'source /var/www/.nvm/nvm.sh && pnpm start -p ${APP_PORT}'

Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Environment variables are now loaded automatically by Next.js from the .env file
# in the WorkingDirectory. We still set NODE_ENV here for clarity.
Environment="NODE_ENV=production"

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
if ${SUDO} systemctl daemon-reload; then
    log_info "Systemd daemon reloaded."
else
    log_fatal "Failed to reload systemd daemon."
fi

log_info "Enabling ${SERVICE_NAME}.service to start on boot..."
if ${SUDO} systemctl enable "${SERVICE_NAME}.service"; then
    log_info "${SERVICE_NAME}.service enabled."
else
    log_fatal "Failed to enable ${SERVICE_NAME}.service."
fi

# --- 5. Ensure pnpm is available for SYSTEM_USER via corepack ---
# This now calls the shared function from common.sh
# prepare_service_user_pnpm_environment sources necessary variables (SYSTEM_USER, etc.) from config.sh
prepare_service_user_pnpm_environment

# --- 6. Application Build (in DEPLOY_TARGET_DIR) ---

# Set ownership before build to allow www-data to write node_modules, etc.
set_target_ownership_and_permissions "${DEPLOY_TARGET_DIR}" "${SYSTEM_USER}" "${SYSTEM_GROUP}"

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
log_info "Installing all dependencies (including devDependencies) with pnpm in ${DEPLOY_TARGET_DIR} as user ${SYSTEM_USER}..."
if ${SUDO} -u "${SYSTEM_USER}" -H bash -c "export NVM_DIR=/var/www/.nvm; [ -s \"$NVM_DIR/nvm.sh\" ] && \. \"$NVM_DIR/nvm.sh\"; cd ${DEPLOY_TARGET_DIR} && pnpm install --frozen-lockfile"; then
    log_info "Dependencies installed."
else
    log_fatal "Failed to install dependencies in ${DEPLOY_TARGET_DIR}."
fi

# log_info "Running Prisma Generate..."
# if pnpm prisma generate; then
#     log_info "Prisma Generate successful."
# else
#     log_fatal "Prisma Generate failed."
# fi

log_info "Removing Next.js cache in ${DEPLOY_TARGET_DIR} (if any)..."
if ${SUDO} -u "${SYSTEM_USER}" bash -c "cd ${DEPLOY_TARGET_DIR} && rm -rf .next"; then # Relative to current dir, which is DEPLOY_TARGET_DIR
    log_info "Next.js cache removed."
else
    log_warning "Failed to remove .next directory, or it didn't exist."
fi

log_info "Building Next.js application in ${DEPLOY_TARGET_DIR} as user ${SYSTEM_USER}..."
if ${SUDO} -u "${SYSTEM_USER}" -H bash -c "export NVM_DIR=/var/www/.nvm; [ -s \"$NVM_DIR/nvm.sh\" ] && \. \"$NVM_DIR/nvm.sh\"; cd ${DEPLOY_TARGET_DIR} && pnpm next build ."; then
    log_info "Next.js application built."
else
    log_fatal "Next.js application build failed."
fi

# Prune devDependencies after build to keep the deployment artifact lean
log_info "Pruning devDependencies as user ${SYSTEM_USER}..."
if ${SUDO} -u "${SYSTEM_USER}" -H bash -c "export NVM_DIR=/var/www/.nvm; [ -s \"$NVM_DIR/nvm.sh\" ] && \. \"$NVM_DIR/nvm.sh\"; cd ${DEPLOY_TARGET_DIR} && pnpm prune --prod"; then
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
if ${SUDO} systemctl restart "${SERVICE_NAME}.service"; then
    log_info "${SERVICE_NAME}.service restarted."
else
    log_fatal "Failed to restart ${SERVICE_NAME}.service."
fi

log_info "Reloading Caddy (if used)..."
# Assuming Caddy is configured and needs reloading after backend restart/update.
if systemctl list-units --full -all | grep -q 'caddy.service'; then
    if ${SUDO} systemctl reload caddy; then
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
echo " Service Status:   ${SUDO} systemctl status ${SERVICE_NAME}.service"
echo " Service Logs:   journalctl -u ${SERVICE_NAME}.service -f"
echo ""
log_info " IMPORTANT REMINDERS:"
log_info " 1. Ensure your secrets file (${_TARGET_SECRETS_FILE_FULL_PATH}) is correctly populated"
log_info "    with all necessary production values (it was copied from ${_SOURCE_SECRETS_FILE_FULL_PATH})."
log_info " 2. The application is now running from ${DEPLOY_TARGET_DIR} as user ${SYSTEM_USER}."
log_info " 3. Your Caddy (or other reverse proxy) configuration should be proxying to localhost:${APP_PORT}."
log_info "--------------------------------------------------------------------"