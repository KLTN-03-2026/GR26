#!/usr/bin/env bash

set -euo pipefail

# Script import tài khoản owner dùng gói Trial trực tiếp vào database.
# Có thể override toàn bộ thông tin bằng biến môi trường khi chạy script.

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_NAME="${DB_NAME:-smartfnb}"
DB_USER="${DB_USER:-smartfnb}"
DB_PASSWORD="${DB_PASSWORD:-smartfnb123}"

TRIAL_TENANT_NAME="${TRIAL_TENANT_NAME:-SmartF&B Trial Demo}"
TRIAL_TENANT_SLUG="${TRIAL_TENANT_SLUG:-}"
TRIAL_OWNER_NAME="${TRIAL_OWNER_NAME:-Hoang Nguyen}"
TRIAL_OWNER_EMAIL="${TRIAL_OWNER_EMAIL:-trial.owner@smartfnb.local}"
TRIAL_OWNER_PASSWORD="${TRIAL_OWNER_PASSWORD:-Trial@123456}"
TRIAL_OWNER_PHONE="${TRIAL_OWNER_PHONE:-0900000001}"
TRIAL_DURATION_DAYS="${TRIAL_DURATION_DAYS:-7}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/sql/import-trial-account.sql"

if ! command -v psql >/dev/null 2>&1; then
  echo "Khong tim thay lenh psql. Vui long cai dat PostgreSQL client truoc khi chay script."
  exit 1
fi

if [[ ! -f "${SQL_FILE}" ]]; then
  echo "Khong tim thay file SQL: ${SQL_FILE}"
  exit 1
fi

if [[ -z "${TRIAL_OWNER_EMAIL}" || -z "${TRIAL_OWNER_PASSWORD}" ]]; then
  echo "TRIAL_OWNER_EMAIL va TRIAL_OWNER_PASSWORD khong duoc de trong."
  exit 1
fi

if ! [[ "${TRIAL_DURATION_DAYS}" =~ ^[0-9]+$ ]] || [[ "${TRIAL_DURATION_DAYS}" -lt 1 ]]; then
  echo "TRIAL_DURATION_DAYS phai la so nguyen duong."
  exit 1
fi

export PGPASSWORD="${DB_PASSWORD}"

echo "=== SMARTF&B TRIAL ACCOUNT IMPORT ==="
echo "DB      : ${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo "Tenant  : ${TRIAL_TENANT_NAME}"
echo "Owner   : ${TRIAL_OWNER_NAME} <${TRIAL_OWNER_EMAIL}>"
echo "Trial   : ${TRIAL_DURATION_DAYS} ngay"
echo

psql \
  -X \
  -v ON_ERROR_STOP=1 \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -v tenant_name="${TRIAL_TENANT_NAME}" \
  -v tenant_slug="${TRIAL_TENANT_SLUG}" \
  -v owner_name="${TRIAL_OWNER_NAME}" \
  -v owner_email="${TRIAL_OWNER_EMAIL}" \
  -v owner_password="${TRIAL_OWNER_PASSWORD}" \
  -v owner_phone="${TRIAL_OWNER_PHONE}" \
  -v trial_days="${TRIAL_DURATION_DAYS}" \
  -f "${SQL_FILE}"

echo
echo "Hoan tat import trial account."
echo "Dang nhap:"
echo "  Email    : ${TRIAL_OWNER_EMAIL}"
echo "  Password : ${TRIAL_OWNER_PASSWORD}"
