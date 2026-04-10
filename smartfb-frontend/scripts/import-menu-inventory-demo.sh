#!/usr/bin/env bash

set -euo pipefail

# Script import data demo cho menu va kho.
# Yeu cau tenant va branch da ton tai san trong DB.
# Tenant se duoc tim theo email owner cua tenant.

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_NAME="${DB_NAME:-smartfnb}"
DB_USER="${DB_USER:-smartfnb}"
DB_PASSWORD="${DB_PASSWORD:-smartfnb123}"

SEED_OWNER_EMAIL="${SEED_OWNER_EMAIL:-trial.owner@smartfnb.local}"
SEED_BRANCH_CODE="${SEED_BRANCH_CODE:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/sql/import-menu-inventory-demo-2026-04-08.sql"

if ! command -v psql >/dev/null 2>&1; then
  echo "Khong tim thay lenh psql. Vui long cai dat PostgreSQL client truoc khi chay script."
  exit 1
fi

if [[ ! -f "${SQL_FILE}" ]]; then
  echo "Khong tim thay file SQL: ${SQL_FILE}"
  exit 1
fi

if [[ -z "${SEED_OWNER_EMAIL}" ]]; then
  echo "SEED_OWNER_EMAIL khong duoc de trong."
  exit 1
fi

export PGPASSWORD="${DB_PASSWORD}"

echo "=== SMARTF&B MENU + INVENTORY DEMO IMPORT ==="
echo "DB          : ${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo "Owner email : ${SEED_OWNER_EMAIL}"
if [[ -n "${SEED_BRANCH_CODE}" ]]; then
  echo "Branch code : ${SEED_BRANCH_CODE}"
else
  echo "Branch code : <chi nhanh dau tien cua tenant>"
fi
echo

psql \
  -X \
  -v ON_ERROR_STOP=1 \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -v owner_email="${SEED_OWNER_EMAIL}" \
  -v branch_code="${SEED_BRANCH_CODE}" \
  -f "${SQL_FILE}"

echo
echo "Hoan tat import data demo cho menu va kho."
