# Plan: app/scheduler/ — jobs + runner
> Ngày: 2026-04-15 | Session 6 — TASK A

## Phân tích hiện trạng

### jobs.py
- `train_all_tenants` — có nhưng **thiếu try/except + time tracking**
- `predict_all_branches` — TODO placeholder
- `fetch_weather_all` — TODO placeholder

### runner.py
- `start_scheduler()` — đã đăng ký 3 jobs nhưng **thiếu CronTrigger, misfire_grace_time**
- `stop_scheduler()` ✅

### main.py
- lifespan đã có nhưng scheduler bị comment out — cần bỏ comment

## Thay đổi cần làm

### jobs.py
1. `train_all_tenants` — wrap try/except, thêm `time.monotonic()`
2. `predict_all_branches` — implement gọi `predict_service.predict_all_branches(db)`
3. `fetch_weather_all` — implement gọi `weather_service.fetch_all_branches_weather(db)`

### runner.py
- Đổi `trigger="cron"` thành `CronTrigger(...)` object
- Thêm `misfire_grace_time` (train=3600, predict=1800)
- Thêm `timezone="Asia/Ho_Chi_Minh"` vào CronTrigger

### main.py
- Bỏ comment START/STOP scheduler trong lifespan

## Ghi chú
- `misfire_grace_time`: nếu server restart đúng lúc job phải chạy, APScheduler sẽ chạy bù nếu thời gian trễ < grace_time
- Jobs KHÔNG re-raise exception — scheduler tiếp tục chạy kể cả khi 1 job lỗi
