# Plan: Khởi tạo Skeleton AI Service

**Status:** ✅ DONE
**Service:** ai-service
**Ngày bắt đầu:** 14/04/2026
**Assignee:** @hoang

---

## Mô tả

Tạo toàn bộ skeleton ban đầu cho `ai-service` — FastAPI app chạy ở port 8001,
kết nối PostgreSQL async, health check endpoint, và cấu trúc thư mục đúng theo
`docs/architecture/ai-service-structure.md`.

Đây là sprint 0: không có logic ML, chỉ scaffold để các sprint tiếp theo cắm vào.

---

## ⚠️ Lưu ý Python Version

- **Python 3.13** (hệ thống) — **KHÔNG tương thích** với NeuralProphet + PyTorch
- **Python 3.11** — phiên bản khuyến nghị cho NeuralProphet
- Giải pháp: **Miniconda** (cài qua Homebrew) + conda env Python 3.11

```bash
# Cài Miniconda qua Homebrew (đã thực hiện)
brew install --cask miniconda

# Khởi tạo conda cho shell hiện tại
conda init zsh && source ~/.zshrc

# Tạo env Python 3.11
conda create -n smartfnb-ai python=3.11 -y
conda activate smartfnb-ai

# Cài dependencies
pip install -r requirements.txt
```

---

## Vị trí trong cấu trúc thư mục

### Files tạo mới

- [x] `docs/plans/2026-04-14/01-init-skeleton.md` — file này
- [ ] `requirements.txt`
- [ ] `.env.example`
- [ ] `app/__init__.py`
- [ ] `app/main.py`
- [ ] `app/core/__init__.py`
- [ ] `app/core/config.py`
- [ ] `app/core/database.py`
- [ ] `app/core/security.py`      (stub)
- [ ] `app/core/logging.py`       (stub)
- [ ] `app/api/__init__.py`
- [ ] `app/api/deps.py`           (stub)
- [ ] `app/api/v1/__init__.py`
- [ ] `app/api/v1/health.py`
- [ ] `app/api/v1/forecast.py`    (stub)
- [ ] `app/api/v1/train.py`       (stub)
- [ ] `app/models/__init__.py`
- [ ] `app/models/forecast_result.py`  (stub)
- [ ] `app/models/train_log.py`        (stub)
- [ ] `app/schemas/__init__.py`
- [ ] `app/schemas/forecast.py`        (stub)
- [ ] `app/schemas/train.py`           (stub)
- [ ] `app/services/__init__.py`
- [ ] `app/services/data_service.py`   (stub)
- [ ] `app/services/train_service.py`  (stub)
- [ ] `app/services/predict_service.py` (stub)
- [ ] `app/services/weather_service.py` (stub)
- [ ] `app/services/event_service.py`   (stub)
- [ ] `app/scheduler/__init__.py`
- [ ] `app/scheduler/jobs.py`          (stub)
- [ ] `app/scheduler/runner.py`        (stub)
- [ ] `app/utils/__init__.py`
- [ ] `app/utils/model_io.py`          (stub)
- [ ] `app/utils/stock_calculator.py`  (stub)
- [ ] `app/utils/dataframe_builder.py` (stub)
- [ ] `storage/models/.gitkeep`
- [ ] `tests/__init__.py`
- [ ] `tests/conftest.py`             (stub)

---

## Logic chính cần implement trong sprint này

```
1. FastAPI app khởi động ở port 8001
2. GET /health → {"status": "ok", "service": "smartfnb-ai", "version": "0.1.0"}
3. SQLAlchemy async engine kết nối PostgreSQL qua DATABASE_URL từ .env
4. Pydantic Settings đọc tất cả env vars cần thiết
5. Tất cả service/schema/model còn lại là stub (raise NotImplementedError hoặc pass)
```

---

## DB liên quan

Ở sprint này chưa kết nối DB thực — chỉ cấu hình engine. Không migrate.

| Bảng | Thao tác | Ghi chú |
|------|----------|---------|
| — | — | Sprint 0: chỉ scaffold |

---

## Checklist triển khai

### 1. Environment
- [ ] Ghi chú Python 3.11 requirement vào plan và README
- [ ] Tạo `requirements.txt` với tất cả dependencies
- [ ] Tạo `.env.example` theo docs/architecture

### 2. Core
- [ ] `config.py` — Pydantic BaseSettings, đọc từ .env
- [ ] `database.py` — SQLAlchemy async engine + AsyncSession + get_db()
- [ ] `logging.py` — Logger chuẩn Python logging
- [ ] `security.py` — stub verify_token()

### 3. API
- [ ] `health.py` — GET /health endpoint thực sự hoạt động
- [ ] `forecast.py` — stub endpoint
- [ ] `train.py` — stub endpoint
- [ ] `deps.py` — get_db, get_current_tenant stubs

### 4. Main app
- [ ] `main.py` — FastAPI(), mount router, lifespan event (startup DB check)

### 5. Stubs
- [ ] Tất cả services, models, schemas, scheduler, utils — skeleton với docstring

### 6. Kiểm tra
- [ ] `uvicorn app.main:app --port 8001` chạy không lỗi
- [ ] `GET /health` trả đúng response
- [ ] `GET /docs` hiện Swagger UI

---

## Câu hỏi cần xác nhận

- [x] Q1: Dùng **Miniconda** (cài qua Homebrew) + `conda create -n smartfnb-ai python=3.11`
- [x] Q2: JWT algorithm = **HS256**, secret dùng chung với Spring Boot
- [x] Q3: Bảng `forecast_results` và `train_logs` đưa vào **Flyway migration của BE** (không dùng SQLAlchemy create_all)
