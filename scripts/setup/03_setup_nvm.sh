#!/bin/bash
# scripts/setup/03_setup_nvm.sh

# -----------------------------------------------------------------------------
# NVM Setup Script
#
# This script installs Node Version Manager (NVM) for the system user
# (www-data) and installs a specific Node.js version for that user.
# This allows the application to use a specific Node.js version independent
# of the system-wide Node.js installation.
# -----------------------------------------------------------------------------

set -e

# Determine script's own directory to reliably source config and common libs
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib/config.sh
source "${_SCRIPT_DIR}/../lib/config.sh"
# shellcheck source=../lib/common.sh
source "${_SCRIPT_DIR}/../lib/common.sh"

log_info "Starting NVM setup for user '${SYSTEM_USER}'..."

# --- 1. Install NVM for the system user ---
# NVM needs to be installed in the user's home directory. For system users
# like www-data, we define a conventional home like /var/www.

NVM_DIR_FOR_SYSTEM_USER="/var/www/.nvm"
NODE_VERSION_FOR_APP="20" # Or a specific version like "20.11.0"

log_info "Ensuring NVM directory exists for '${SYSTEM_USER}' at ${NVM_DIR_FOR_SYSTEM_USER}..."
if sudo mkdir -p "${NVM_DIR_FOR_SYSTEM_USER}"; then
    log_info "NVM directory ensured."
else
    log_fatal "Failed to create NVM directory: ${NVM_DIR_FOR_SYSTEM_USER}"
fi

log_info "Setting ownership of ${NVM_DIR_FOR_SYSTEM_USER} to '${SYSTEM_USER}:${SYSTEM_GROUP}'..."
if sudo chown -R "${SYSTEM_USER}:${SYSTEM_GROUP}" "${NVM_DIR_FOR_SYSTEM_USER}"; then
    log_info "Ownership set."
else
    log_fatal "Failed to set ownership for ${NVM_DIR_FOR_SYSTEM_USER}."
fi

log_info "Downloading and installing NVM for '${SYSTEM_USER}'..."
# Run as SYSTEM_USER to ensure correct permissions and environment
# Use a temporary file for the install script to avoid permission issues
NVM_INSTALL_SCRIPT_URL="https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh"
TEMP_INSTALL_SCRIPT="/tmp/install_nvm_for_${SYSTEM_USER}.sh"

ensure_command_exists "curl"

if curl -fsSL "${NVM_INSTALL_SCRIPT_URL}" -o "${TEMP_INSTALL_SCRIPT}"; then
    log_info "NVM install script downloaded."
else
    log_fatal "Failed to download NVM install script from ${NVM_INSTALL_SCRIPT_URL}."
fi

if sudo -u "${SYSTEM_USER}" -H bash "${TEMP_INSTALL_SCRIPT}" --no-bashrc --no-profile --default-npm --default-yarn; then
    log_info "NVM installed for '${SYSTEM_USER}'."
else
    log_fatal "Failed to install NVM for '${SYSTEM_USER}'."
fi

# Clean up temporary install script
if [ -f "${TEMP_INSTALL_SCRIPT}" ]; then
    rm "${TEMP_INSTALL_SCRIPT}"
fi

# --- 2. Install Node.js version using NVM for the system user ---
log_info "Installing Node.js version ${NODE_VERSION_FOR_APP} using NVM for '${SYSTEM_USER}'..."

# The NVM script needs to be sourced to be available in the shell.
# We run this command as the system user.
if sudo -u "${SYSTEM_USER}" -H bash -c "export NVM_DIR=${NVM_DIR_FOR_SYSTEM_USER}; [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\"; nvm install ${NODE_VERSION_FOR_APP} && nvm alias default ${NODE_VERSION_FOR_APP}"; then
    log_info "Node.js ${NODE_VERSION_FOR_APP} installed and set as default for '${SYSTEM_USER}'."
else
    log_fatal "Failed to install Node.js ${NODE_VERSION_FOR_APP} for '${SYSTEM_USER}'."
fi

log_info "NVM setup complete for user '${SYSTEM_USER}'."
