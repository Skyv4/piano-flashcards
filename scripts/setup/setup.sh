#!/bin/bash
# scripts/setup/setup.sh

# -----------------------------------------------------------------------------
# Global Setup Script
#
# This script orchestrates the execution of all individual setup scripts
# in the 'scripts/setup/' directory in a predefined order.
# -----------------------------------------------------------------------------

set -e

# Determine script's own directory to reliably source config and common libs
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib/config.sh
source "${_SCRIPT_DIR}/../lib/config.sh"
# shellcheck source=../lib/common.sh
source "${_SCRIPT_DIR}/../lib/common.sh"

log_info "Starting global setup process..."

# List of setup scripts to run in order
SETUP_SCRIPTS=(
    "01_setup_system.sh"
    "02_setup_nodejs.sh"
    "03_setup_nvm.sh"
    "04_setup_pnpm.sh"
    "05_setup_postgres.sh"
    "06_setup_user.sh"
    "07_setup_caddy.sh"
)

for script in "${SETUP_SCRIPTS[@]}"; do
    SCRIPT_PATH="${_SCRIPT_DIR}/${script}"
    if [ -f "${SCRIPT_PATH}" ]; then
        log_info "Executing setup script: ${script}"
        if bash "${SCRIPT_PATH}"; then
            log_info "Successfully executed ${script}"
        else
            log_fatal "Failed to execute ${script}. Aborting setup."
        fi
    else
        log_warning "Setup script not found: ${script}. Skipping."
    fi
    echo "" # Add a newline for better readability between script outputs
done

log_info "Global setup process completed successfully."
