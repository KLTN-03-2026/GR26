# syntax=docker/dockerfile:1.7
FROM python:3.11-slim

WORKDIR /app

# Tăng độ ổn định khi tải wheel lớn như torch trên mạng chậm.
ENV PIP_DEFAULT_TIMEOUT=1200 \
    PIP_RETRIES=20 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_PROGRESS_BAR=off

SHELL ["/bin/sh", "-c"]

# Pin Torch để tránh pip tự kéo bản mới nhất quá lớn và dễ timeout trên arm64.
ARG TORCH_VERSION=2.5.1
ARG KALEIDO_VERSION=0.2.1

# Layer cache: install deps trước khi copy source
# Thay đổi source code không invalidate layer này
COPY requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
    set -eux; \
    python -m pip install --upgrade pip setuptools wheel

# Cài riêng wheel ML lớn để cache từng layer, tránh mất lại toàn bộ khi mạng rớt.
RUN --mount=type=cache,target=/root/.cache/pip \
    set -eux; \
    for attempt in 1 2 3 4 5; do \
      python -m pip install \
        --prefer-binary \
        --timeout "${PIP_DEFAULT_TIMEOUT}" \
        --retries "${PIP_RETRIES}" \
        "torch==${TORCH_VERSION}" && break; \
      if [ "$attempt" = "5" ]; then \
        echo "torch install failed after ${attempt} attempts"; \
        exit 1; \
      fi; \
      echo "torch install failed on attempt ${attempt}; retrying in 15s"; \
      sleep 15; \
    done

RUN --mount=type=cache,target=/root/.cache/pip \
    set -eux; \
    for attempt in 1 2 3 4 5; do \
      python -m pip install \
        --prefer-binary \
        --timeout "${PIP_DEFAULT_TIMEOUT}" \
        --retries "${PIP_RETRIES}" \
        "kaleido==${KALEIDO_VERSION}" && break; \
      if [ "$attempt" = "5" ]; then \
        echo "kaleido install failed after ${attempt} attempts"; \
        exit 1; \
      fi; \
      echo "kaleido install failed on attempt ${attempt}; retrying in 15s"; \
      sleep 15; \
    done

RUN --mount=type=cache,target=/root/.cache/pip \
    set -eux; \
    for attempt in 1 2 3 4 5; do \
      python -m pip install \
        --prefer-binary \
        --timeout "${PIP_DEFAULT_TIMEOUT}" \
        --retries "${PIP_RETRIES}" \
        -r requirements.txt && break; \
      if [ "$attempt" = "5" ]; then \
        echo "requirements install failed after ${attempt} attempts"; \
        exit 1; \
      fi; \
      echo "requirements install failed on attempt ${attempt}; retrying in 15s"; \
      sleep 15; \
    done

# Copy source code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Tạo folder storage — persist qua Docker volume mount
RUN mkdir -p storage/models

EXPOSE 8001

# Single worker — NeuralProphet không thread-safe với multi-worker
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
