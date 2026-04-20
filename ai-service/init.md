---
description: Khởi tạo context dự án SmartF&B AI Service — đọc rules, cấu trúc trước khi làm việc
---

## Bước 1: Đọc coding rules bắt buộc
Đọc file `CLAUDE.md` tại root của `ai-service/`.

// turbo
## Bước 2: Đọc cấu trúc dự án tổng thể
Đọc file `AI_PROJECT_STRUCTURE.md` tại root repo `GR26/` để nắm bức tranh toàn hệ thống.

// turbo
## Bước 3: Đọc tài liệu kiến trúc AI service
Đọc SONG SONG 2 file sau:
- `docs/architecture/ai-service-structure.md`   — cấu trúc thư mục chi tiết
- `docs/architecture/data-flow.md`              — luồng dữ liệu train/predict/api

// turbo
## Bước 4: Đọc task checklist hiện tại
Đọc file `docs/plans/current-sprint.md`.

// turbo
## Bước 5: Xem cây thư mục thực tế
Chạy:
```bash
find app -type f -name "*.py" | sort
ls storage/models/ 2>/dev/null || echo "(chưa có model nào được train)"
```

// turbo
## Bước 6: Kiểm tra kết nối DB và API BE
Chạy:
```bash
python -c "from app.core.database import engine; print('DB OK')"
curl -s http://localhost:8080/actuator/health | python -m json.tool
```

Xác nhận với user:
- ✅ Modules/services đã hoàn thành
- 🔄 Đang làm
- ⚠️ Vấn đề phát hiện (thiếu data, model chưa được train, kết nối lỗi...)

---

## 📌 File đọc THEO TÌNH HUỐNG

| Khi nào | File cần đọc |
|---------|-------------|
| Implement tính năng train/predict mới | `docs/skills/vibe-coding-services.md` |
| Cần thêm API endpoint mới | `docs/architecture/api-endpoints.md` |
| Cần xử lý sự kiện / ngày lễ / thời tiết | `CLAUDE.md` phần 5 + 7 |
| Có vấn đề kỹ thuật cần so sánh giải pháp | `docs/skills/engineering-decisions.md` |
| Debug model accuracy kém | `docs/skills/model-evaluation.md` |

## Sau mỗi lần implement xong 1 feature:
1. Cập nhật checklist trong `docs/plans/[tên-feature].md`
2. Cập nhật `docs/architecture/api-endpoints.md` nếu có endpoint mới
3. Chạy test liên quan: `pytest tests/test_{module}.py -v`
