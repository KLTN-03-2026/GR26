FROM python:3.11-slim

WORKDIR /app

# Layer cache: install deps trước khi copy source
# Thay đổi source code không invalidate layer này
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Tạo folder storage — persist qua Docker volume mount
RUN mkdir -p storage/models

EXPOSE 8001

# Single worker — NeuralProphet không thread-safe với multi-worker
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
