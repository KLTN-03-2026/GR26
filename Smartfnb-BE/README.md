# 📚 SmartF&B — Bộ Prompt Files cho AI Coding Agent
> Hướng dẫn sử dụng bộ tài liệu prompt để vibe coding hiệu quả với Java 21 + Spring Boot

---

## 📁 CẤU TRÚC THƯ MỤC

```
smartfnb-prompts/
│
├── rules.md                    ← ⭐ ĐỌC ĐẦU TIÊN — Quy tắc làm việc chung
│
├── 🤖 .agent/
│   └── skills/
│       ├── write-usecase.md        ← Skill: Viết Use Case trước khi code
│       └── vibe-coding-modules.md  ← Skill: Prompt nhanh cho từng module
│
└── 📚 docs/
    ├── architecture/
    │   ├── CODING_GUIDELINES.md    ← Hiến pháp kiến trúc DDD + CQRS
    │   ├── RBAC_STANDARD.md        ← Chuẩn phân quyền multi-tenant
    │   ├── SECURITY_CHECKLIST.md   ← Anti-patterns & Security checklist
    │   └── DOMAIN_EVENTS.md        ← Catalogue Domain Events giữa module
    ├── templates/
    │   └── ENGINEERING_KB.md       ← Template đánh giá giải pháp kỹ thuật
    └── usecases/                   ← Use case files được generate (empty)
```

---

## 🚀 QUICK START — 3 bước bắt đầu

### Bước 1: Nạp context vào AI
```
"Hãy đọc các file sau trước khi làm việc với tôi:
1. rules.md
2. docs/architecture/CODING_GUIDELINES.md
3. docs/architecture/RBAC_STANDARD.md"
```

### Bước 2: Mô tả tính năng → AI viết Use Case
```
"Tôi muốn tính năng [MÔ TẢ NGẮN GỌN].
Đọc .agent/skills/write-usecase.md và viết use case trước, đừng code ngay."
```

### Bước 3: Sau khi duyệt Use Case → Vibe Code
```
"Use case UC-XXX đã được duyệt. Giờ implement theo đúng kiến trúc trong 
CODING_GUIDELINES.md. Tham khảo .agent/skills/vibe-coding-modules.md 
cho context module [TÊN MODULE]."
```

---

## 💬 PROMPT MẪU THEO TỪNG TÌNH HUỐNG

### Tình huống 1: Bắt đầu module mới
```
Tôi cần implement Module [Tên] cho dự án SmartF&B.

Trước tiên, đọc:
- rules.md (quy tắc code)
- docs/architecture/CODING_GUIDELINES.md (kiến trúc)
- docs/architecture/RBAC_STANDARD.md (phân quyền)

Sau đó implement theo đúng kiến trúc DDD + CQRS:
1. Domain Entity + Value Objects
2. Repository Interface  
3. Command + CommandHandler
4. Query + QueryHandler
5. Controller + Request/Response DTO
6. JPA Entity + Repository Implementation

Bắt đầu với: [Task cụ thể, ví dụ: "Tạo đơn hàng mới - PlaceOrder"]
```

### Tình huống 2: Fix bug
```
Bug Report: [Mô tả bug]
Module: [Tên module]

Sau khi fix:
1. Giải thích root cause
2. Tự động tạo file docs/dev-notes/BUG-{date}-{module}.md theo template trong rules.md
3. Đề xuất test case để phòng tránh bug tương tự
```

### Tình huống 3: Cần đánh giá giải pháp kỹ thuật
```
Vấn đề: [Mô tả vấn đề kỹ thuật]

Đọc docs/templates/ENGINEERING_KB.md và viết proposal đánh giá 
ít nhất 2 giải pháp, nêu rõ trade-offs và khuyến nghị phù hợp với:
- Quy mô: dự án startup, 5 thành viên, timeline 2.5 tháng
- Budget: hạn chế, ưu tiên open source
- Phase hiện tại: [MVP / Full Ops / AI]
```

### Tình huống 4: Review code bảo mật
```
Review đoạn code sau theo checklist trong docs/architecture/SECURITY_CHECKLIST.md.
Tìm kiếm: IDOR, Cross-tenant leak, ThreadLocal leak, Mass Assignment, Sensitive Data Exposure.

[PASTE CODE VÀO ĐÂY]
```

### Tình huống 5: Viết test
```
Viết unit test + integration test cho [Class/Method] theo quy tắc trong rules.md:
- Unit test: dùng JUnit 5, Mockito
- Integration test: dùng @SpringBootTest + Testcontainers PostgreSQL
- Mỗi test có @DisplayName bằng tiếng Việt
- Bao gồm: happy case, exception case, edge case (thiếu phân quyền, sai tenant)
```

---

## 📊 MỨC ĐỘ PHỨC TẠP CÁC MODULE

| Module | Độ phức tạp | Phase | Ghi chú |
|--------|------------|-------|---------|
| Auth | 🟡 Trung bình | MVP | JWT, OTP, RBAC |
| Subscription | 🟡 Trung bình | MVP | Feature flags |
| Branch | 🟡 Trung bình | MVP | Multi-tenant scope |
| Staff | 🟡 Trung bình | Full Ops | Shift, RBAC matrix |
| Menu | 🔴 Cao | MVP | Recipe, soft delete |
| **Order & Table** | 🔴🔴 **Rất cao** | MVP | Realtime, event-driven |
| Payment | 🔴 Cao | MVP | Payment gateway, Invoice |
| Promotion | 🟡 Trung bình | Full Ops | Voucher, concurrency |
| **Inventory** | 🔴 Cao | MVP | FIFO, auto-deduct |
| Supplier | 🟢 Thấp | Full Ops | CRUD đơn giản |
| Report Revenue | 🟡 Trung bình | Full Ops | Aggregation, Export |
| Report Inventory | 🟡 Trung bình | Full Ops | |
| Report HR | 🟡 Trung bình | Full Ops | Privacy (lương cá nhân) |

---

## 🗓️ GỢI Ý THỨ TỰ IMPLEMENT

```
Sprint 1 (Tuần 1-2): Nền tảng
  → shared/ (TenantContext, BaseEntity, GlobalExceptionHandler)
  → auth/ (Register, Login, JWT, OTP)
  → subscription/ (Plan, Feature Flag)
  → branch/ (CRUD, Branch selection)

Sprint 2 (Tuần 3-4): Core POS
  → menu/ (Category, MenuItem, Topping, Recipe)
  → order/ (Table management, Order lifecycle)

Sprint 3 (Tuần 5-6): Thanh toán & Kho
  → payment/ (Cash, QR, Invoice)
  → inventory/ (Stock management, Auto-deduct)
  → promotion/ (Voucher, Discount)

Sprint 4 (Tuần 7-8): Nhân sự & Báo cáo
  → staff/ (Staff, Position, Shift, Schedule)
  → report/ (Revenue, Inventory, HR)

Sprint 5 (Tuần 9-10): AI & Polish
  → AI demand forecast (Python service)
  → Performance tuning, Security audit
  → Load testing
```

---

*Tài liệu này được tạo cho dự án SmartF&B — Đại học Duy Tân, tháng 03/2026*
*Mentor: ThS. Phan Long | Scrum Master: Nguyễn Văn Hoàng*
