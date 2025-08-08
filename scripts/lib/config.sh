#!/bin/bash

# -----------------------------------------------------------------------------
# Shared Configuration Variables
#
# This file defines common variables used across various setup and deployment
# scripts for the TrainerApp project.
#
# IMPORTANT: Review and update placeholder values, especially DB_PASSWORD,
# before running any setup scripts that depend on this configuration.
# -----------------------------------------------------------------------------

# --- Project Structure ---
# Determine Project Root Directory dynamically
# This assumes config.sh is in scripts/lib/, so ../.. goes to project root.
PROJECT_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

APP_DIR_RELATIVE="app"
APP_DIR="${PROJECT_ROOT_DIR}/${APP_DIR_RELATIVE}"
SCRIPTS_DIR="${PROJECT_ROOT_DIR}/scripts"
LIB_DIR="${SCRIPTS_DIR}/lib"

# --- Deployment Configuration ---
DEPLOY_TARGET_DIR="/var/www/trainerapp"
SYSTEM_USER="www-data"
SYSTEM_GROUP="www-data"
SERVICE_NAME="trainerapp"
SERVICE_FILE_PATH="/etc/systemd/system/${SERVICE_NAME}.service" # Used by deploy.sh

# --- Secrets and Environment Files ---
# For app/.env (typically local development or base for secrets)
APP_ENV_FILE_PATH="${APP_DIR}/.env"

# For app/.secrets (source for production secrets, copied to DEPLOY_TARGET_DIR)
# These are basenames; full paths constructed in scripts as needed.
SOURCE_SECRETS_FILE_BASENAME=".secrets"
TARGET_SECRETS_FILE_BASENAME=".secrets" # Should be same as source for consistency

# Path to the script that generates app/.secrets from app/secrets.default
GENERATE_SECRETS_SCRIPT_RELATIVE_PATH="scripts/generate_secrets.sh" # Relative to PROJECT_ROOT_DIR

# --- Database Configuration (Used by setup scripts and generate_secrets.sh) ---
# Check for global PostgreSQL configuration
GLOBAL_CONFIG_PATH="/home/gabe/.postgres_config.sh"
if [ -f "$GLOBAL_CONFIG_PATH" ]; then
    source "$GLOBAL_CONFIG_PATH"
    DB_PASSWORD="$POSTGRES_PASSWORD"
else
    # Fallback to placeholder if global config is not available
    DB_PASSWORD="!!!REPLACE_WITH_YOUR_SECURE_POSTGRESQL_PASSWORD!!!"
fi

DB_USER="trainerapp_user"
DB_NAME="trainerapp_db"
DB_HOST="localhost"
DB_PORT="5432"

# --- PNPM/Corepack Configuration ---
# Cache directory for the SYSTEM_USER (e.g., www-data) when using corepack.
# Typically /var/www/.cache/node/corepack if SYSTEM_USER's home is /var/www
COREPACK_SERVICE_USER_CACHE_DIR="/var/www/.cache/node/corepack"

# --- Application Specific ---
# NEXTAUTH_URL for production (used in systemd service file)
NEXTAUTH_URL_PROD="https://chess.skyvale.org"
# Port the Next.js app runs on (used in systemd service file)
APP_PORT="3000"

# Add other shared configuration variables here as needed.

# --- Sanity Check (Optional but Recommended) ---
# Ensure critical directories derived from PROJECT_ROOT_DIR exist if scripts assume them.
# For example, ensure APP_DIR is valid:
if [ ! -d "${APP_DIR}" ]; then
    echo "Configuration Error: Application directory not found at ${APP_DIR}" >&2
    echo "PROJECT_ROOT_DIR was determined as: ${PROJECT_ROOT_DIR}" >&2
    # exit 1 # Uncomment if you want scripts to fail hard if APP_DIR is wrong
fi