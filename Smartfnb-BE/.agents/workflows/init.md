---
description: Khởi tạo context dự án SmartF&B — đọc rules, schema và task trước khi làm việc
---

## Bước 1: Đọc coding rules bắt buộc
Đọc file `e:\SmartF&B\rules.md`.

// turbo
## Bước 2: Đọc 4 file architecture guidelines (BẮT BUỘC trước mọi tính năng)
Đọc SONG SONG 4 file sau:
- `e:\SmartF&B\prompts\docs\architecture\CODING_GUIDELINES.md`
- `e:\SmartF&B\prompts\docs\architecture\RBAC_STANDARD.md`
- `e:\SmartF&B\prompts\docs\architecture\SECURITY_CHECKLIST.md`
- `e:\SmartF&B\prompts\docs\architecture\DOMAIN_EVENTS.md`

// turbo
## Bước 3: Đọc DB schema
Đọc file `e:\SmartF&B\smartfnb_schema.sql`.

// turbo
## Bước 4: Đọc task checklist
Đọc file `C:\Users\ASUS\.gemini\antigravity\brain\fc6c26e3-0e68-42b4-ba78-fd16e3c2a615\task.md`.

// turbo
## Bước 5: Xem cấu trúc thư mục src
Chạy: `tree e:\SmartF&B\src /F /A 2>&1 | Select-Object -First 100`

// turbo
## Bước 6: Đọc application.yml
Đọc `e:\SmartF&B\src\main\resources\application.yml`.

Xác nhận với user:
- ✅ Sprint đã hoàn thành
- 🔄 Sprint tiếp theo
- ⚠️ Vi phạm kiến trúc nếu phát hiện

---

## 📌 File đọc THEO TÌNH HUỐNG (không đọc trong /init)

| Khi nào | File cần đọc |
|---------|-------------|
| Bắt đầu implement module cụ thể (Branch, Order, Payment...) | `e:\SmartF&B\prompts\agent\skills\vibe-coding-modules.md` |
| User yêu cầu "phân tích tính năng X" hoặc "viết use case" | `e:\SmartF&B\prompts\agent\skills\write-usecase.md` |
| Có vấn đề kỹ thuật phức tạp cần so sánh giải pháp | `e:\SmartF&B\prompts\docs\templates\ENGINEERING_KB.md` |
| Cần tra cứu yêu cầu nghiệp vụ chi tiết | `e:\SmartF&B\smartfb_user_story_analysis.md` |

## Mỗi lần viết xong 1 api thì phải viết lại mô tả cho FE hiểu vào trong file @frontend_api_integration.md