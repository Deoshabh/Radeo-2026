#!/usr/bin/env bash
# ============================================
# RADEO — Automated Backup Script
# Backs up MongoDB, uploads to MinIO, verifies,
# and rotates old backups.
# ============================================
set -euo pipefail

# ---------- Configuration ----------
BACKUP_DIR="${BACKUP_DIR:-/tmp/radeo-backups}"
MONGO_URI="${MONGO_URI:?MONGO_URI env var is required}"
MINIO_ALIAS="${MINIO_ALIAS:-radeo}"
MINIO_BUCKET="${MINIO_BUCKET:-backups}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:?MINIO_ENDPOINT env var is required}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:?MINIO_ACCESS_KEY env var is required}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:?MINIO_SECRET_KEY env var is required}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DUMP_NAME="radeo_${TIMESTAMP}"
DUMP_PATH="${BACKUP_DIR}/${DUMP_NAME}"
ARCHIVE="${DUMP_PATH}.tar.gz"

log()  { echo "[$(date -Iseconds)] $*"; }
die()  { log "ERROR: $*" >&2; exit 1; }

# ---------- Pre-flight ----------
log "Starting backup — ${DUMP_NAME}"
mkdir -p "${BACKUP_DIR}"

for cmd in mongodump mc tar; do
  command -v "$cmd" >/dev/null 2>&1 || die "Required command not found: $cmd"
done

# Configure MinIO client alias (idempotent)
mc alias set "${MINIO_ALIAS}" "${MINIO_ENDPOINT}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}" --api S3v4 >/dev/null
mc mb --ignore-existing "${MINIO_ALIAS}/${MINIO_BUCKET}" >/dev/null

# ---------- Dump ----------
log "Running mongodump …"
mongodump --uri="${MONGO_URI}" --out="${DUMP_PATH}" --gzip --quiet \
  || die "mongodump failed"

log "Compressing dump …"
tar -czf "${ARCHIVE}" -C "${BACKUP_DIR}" "${DUMP_NAME}"
ARCHIVE_SIZE=$(du -h "${ARCHIVE}" | cut -f1)
log "Archive size: ${ARCHIVE_SIZE}"

# ---------- Upload ----------
REMOTE_KEY="mongodb/${DUMP_NAME}.tar.gz"
log "Uploading to MinIO → ${MINIO_BUCKET}/${REMOTE_KEY}"
mc cp "${ARCHIVE}" "${MINIO_ALIAS}/${MINIO_BUCKET}/${REMOTE_KEY}" --quiet \
  || die "MinIO upload failed"

# ---------- Verify ----------
log "Verifying upload …"
REMOTE_SIZE=$(mc stat "${MINIO_ALIAS}/${MINIO_BUCKET}/${REMOTE_KEY}" 2>/dev/null | grep -i "Size" | awk '{print $NF}')
if [ -z "${REMOTE_SIZE}" ]; then
  die "Verification FAILED — remote object not found"
fi
log "Verification OK (remote size: ${REMOTE_SIZE})"

# ---------- Rotate old backups ----------
log "Rotating backups older than ${RETENTION_DAYS} days …"
mc find "${MINIO_ALIAS}/${MINIO_BUCKET}/mongodb/" --older-than "${RETENTION_DAYS}d" --exec "mc rm {}" 2>/dev/null || true

# ---------- Cleanup local ----------
rm -rf "${DUMP_PATH}" "${ARCHIVE}"
log "Backup complete ✓  (${DUMP_NAME})"
