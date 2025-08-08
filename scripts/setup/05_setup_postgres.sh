#!/bin/bash
# scripts/setup/05_setup_postgres.sh

# -----------------------------------------------------------------------------
# PostgreSQL Setup Script
#
# This script installs PostgreSQL, creates a database and a user for the
# application, and configures authentication.
# -----------------------------------------------------------------------------

set -e

# Determine script's own directory to reliably source config and common libs
_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib/config.sh
source "${_SCRIPT_DIR}/../lib/config.sh"
# shellcheck source=../lib/common.sh
source "${_SCRIPT_DIR}/../lib/common.sh"

log_info "Starting PostgreSQL setup..."

# --- 1. Install PostgreSQL ---
log_info "Installing PostgreSQL..."
ensure_command_exists "sudo"
ensure_command_exists "apt-get"
if sudo apt-get install -y postgresql postgresql-contrib; then
    log_info "PostgreSQL installed."
else
    log_fatal "Failed to install PostgreSQL."
fi

# --- 2. Create Database User and Database ---
log_info "Creating PostgreSQL user '${DB_USER}' and database '${DB_NAME}'..."

# Check if user already exists
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
    log_info "PostgreSQL user '${DB_USER}' already exists."
else
    log_info "Creating PostgreSQL user '${DB_USER}'..."
    if sudo -u postgres createuser "${DB_USER}"; then
        log_info "User '${DB_USER}' created."
    else
        log_fatal "Failed to create PostgreSQL user '${DB_USER}'."
    fi
fi

# Set password for the user
log_info "Setting password for PostgreSQL user '${DB_USER}'..."
if sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"; then
    log_info "Password set for user '${DB_USER}'."
else
    log_fatal "Failed to set password for PostgreSQL user '${DB_USER}'."
fi

# Check if database already exists
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
    log_info "PostgreSQL database '${DB_NAME}' already exists."
else
    log_info "Creating PostgreSQL database '${DB_NAME}'..."
    if sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"; then
        log_info "Database '${DB_NAME}' created and owned by '${DB_USER}'."
    else
        log_fatal "Failed to create PostgreSQL database '${DB_NAME}'."
    fi
fi

# --- 3. Configure PostgreSQL Client Authentication (pg_hba.conf) ---
log_info "Configuring PostgreSQL client authentication (pg_hba.conf)..."

PG_HBA_CONF="/etc/postgresql/${PG_MAJOR_VERSION:-$(pg_lsclusters | awk '/main/{print $1}')}/main/pg_hba.conf"

if [ ! -f "${PG_HBA_CONF}" ]; then
    log_fatal "pg_hba.conf not found at ${PG_HBA_CONF}. Please check your PostgreSQL installation."
fi

# Add or update the line for local connections using md5 authentication
# This assumes you want md5 for local connections for the new user/db
# It's important to back up the original file first.

log_info "Backing up original pg_hba.conf to ${PG_HBA_CONF}.bak..."
if sudo cp "${PG_HBA_CONF}" "${PG_HBA_CONF}.bak"; then
    log_info "Backup created."
else
    log_warning "Failed to create backup of pg_hba.conf. Continuing anyway."
fi

# Use awk to insert or replace the line for the specific user/database
# This is a more robust way to ensure the line is present and correct
# without adding duplicates or breaking existing configs.
# It looks for a line matching 'local' and the DB_NAME and DB_USER, and replaces it.
# If not found, it adds it at the end of the 'local' section.

# Define the line to ensure
AUTH_LINE="local   ${DB_NAME}              ${DB_USER}                                md5"

# Check if the line already exists or needs to be added/updated
if grep -qF "${AUTH_LINE}" "${PG_HBA_CONF}"; then
    log_info "Authentication line for ${DB_USER}@${DB_NAME} already present in pg_hba.conf."
else
    log_info "Adding/updating authentication line for ${DB_USER}@${DB_NAME} in pg_hba.conf..."
    # Use awk to find the last 'local' entry and insert after it, or append if no 'local' entries.
    # This is a simplified approach; for complex pg_hba.conf, manual review is best.
    if sudo awk -v auth_line="${AUTH_LINE}" 
        '/local\s+all\s+all\s+peer/{found_local=1; print; next}
         found_local && !inserted && /^[[:space:]]*$/{print auth_line; inserted=1; print; next}
         1
         END {if (!inserted) print auth_line}' "${PG_HBA_CONF}" > "${PG_HBA_CONF}.tmp" && \
       sudo mv "${PG_HBA_CONF}.tmp" "${PG_HBA_CONF}"; then
        log_info "Authentication line added/updated."
    else
        log_fatal "Failed to add/update authentication line in pg_hba.conf. Please configure manually."
    fi
fi

log_info "Restarting PostgreSQL service to apply changes..."
if sudo systemctl restart postgresql; then
    log_info "PostgreSQL service restarted."
else
    log_fatal "Failed to restart PostgreSQL service. Please check logs."
fi

log_info "PostgreSQL setup complete."
