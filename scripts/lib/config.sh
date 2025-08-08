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

APP_DIR_RELATIVE="src/app"
APP_DIR="${PROJECT_ROOT_DIR}/${APP_DIR_RELATIVE}"
SCRIPTS_DIR="${PROJECT_ROOT_DIR}/scripts"
LIB_DIR="${SCRIPTS_DIR}/lib"

# --- Deployment Configuration ---
DEPLOY_TARGET_DIR="/var/www/piano-learner"
SYSTEM_USER="www-data"
SYSTEM_GROUP="www-data"
SERVICE_NAME="piano-learner"
SERVICE_FILE_PATH="/etc/systemd/system/${SERVICE_NAME}.service" # Used by deploy.sh

# --- Secrets and Environment Files ---
# These are now standard .env files in the project root.
# Scripts should handle .env.local, .env.production, and .env.example as needed.
ENV_EXAMPLE_FILE="${PROJECT_ROOT_DIR}/.env.example"
ENV_LOCAL_FILE="${PROJECT_ROOT_DIR}/.env.local"
ENV_PROD_FILE="${PROJECT_ROOT_DIR}/.env.production"

# The final environment file to be used in the deployment target directory.
# Next.js automatically picks up '.env' in the production environment.
DEPLOY_ENV_FILE_BASENAME=".env"

# Path to the script that generates the local development environment file.
GENERATE_ENV_SCRIPT_RELATIVE_PATH="scripts/generate_secrets.sh" # Relative to PROJECT_ROOT_DIR

# --- Database Configuration (Used by setup scripts and generate_secrets.sh) ---
DB_USER="piano_learner_user"
DB_NAME="piano_learner_db"
DB_HOST="localhost"
DB_PORT="5432"

# Check for global PostgreSQL configuration to set DB_PASSWORD
GLOBAL_CONFIG_PATH="/home/gabe/.postgres_config.sh"
if [ -f "$GLOBAL_CONFIG_PATH" ]; then
    # shellcheck source=/home/gabe/.postgres_config.sh
    source "$GLOBAL_CONFIG_PATH"
    DB_PASSWORD="$POSTGRES_PASSWORD"
else
    # Fallback to placeholder if global config is not available
    DB_PASSWORD="!!!REPLACE_WITH_YOUR_SECURE_POSTGRESQL_PASSWORD!!!"
fi

# --- PNPM/Corepack Configuration ---
# Cache directory for the SYSTEM_USER (e.g., www-data) when using corepack.
# Typically /var/www/.cache/node/corepack if SYSTEM_USER's home is /var/www
COREPACK_SERVICE_USER_CACHE_DIR="/var/www/.cache/node/corepack"

# --- Application Specific ---
# NEXTAUTH_URL for production (used in systemd service file)
NEXTAUTH_URL_PROD="https://piano.skyvale.org"
# Port the Next.js app runs on (used in systemd service file)
APP_PORT="3111"

# Add other shared configuration variables here as needed.

# --- Sanity Check (Optional but Recommended) ---
# Ensure critical directories derived from PROJECT_ROOT_DIR exist if scripts assume them.
# For example, ensure APP_DIR is valid:
if [ ! -d "${APP_DIR}" ]; then
    echo "Configuration Error: Application directory not found at ${APP_DIR}" >&2
    echo "PROJECT_ROOT_DIR was determined as: ${PROJECT_ROOT_DIR}" >&2
    # exit 1 # Uncomment if you want scripts to fail hard if APP_DIR is wrong
fi