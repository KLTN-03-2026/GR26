# 🧠 AI Skill: Viết Use Case Document cho SmartF&B
> Khi developer mô tả 1 tính năng mới, chạy skill này TRƯỚC KHI CODE.
> Output: file `docs/usecases/UC-{số}-{tên-kebab}.md`

---

## 🎯 TRIGGER

Skill này kích hoạt khi developer nói:
- "Tôi muốn tính năng [X]"
- "Viết usecase cho [X]"
- "Phân tích tính năng [X]"
- "Trước khi code [X], hãy viết use case"

---

## 📋 QUY TRÌNH THỰC HIỆN

### Bước 1: Phân tích tính năng được mô tả
Trích xuất từ mô tả của developer:
- **Tên tính năng** (ngắn gọn)
- **Actor** (ai dùng tính năng này)
- **Module liên quan** (order, payment, inventory...)
- **Trigger** (điều gì kích hoạt tính năng)

### Bước 2: Tự động generate file Use Case
Tạo file theo đúng template dưới đây.

### Bước 3: Nêu rõ các câu hỏi cần developer xác nhận
Trước khi code, liệt kê các quyết định còn mơ hồ cần hỏi.

---

## 📄 TEMPLATE USE CASE

```markdown
# UC-{số}: {Tên tính năng}
**Module:** {tên module}
**Actor:** {danh sách actor}
**Ngày tạo:** {date}
**Trạng thái:** Draft | Review | Approved

---

## 1. Mô tả tổng quan
{Một đoạn ngắn mô tả tính năng là gì, tại sao cần, giá trị mang lại}

## 2. Điều kiện tiên quyết (Preconditions)
- [ ] Actor đã đăng nhập và có token hợp lệ
- [ ] Actor có quyền {permission} tại chi nhánh hiện tại
- [ ] {Điều kiện nghiệp vụ cần thỏa mãn trước}

## 3. Luồng chính — Happy Path
| Bước | Actor | Hành động | Hệ thống phản hồi |
|------|-------|-----------|-------------------|
| 1    | {Actor} | {Hành động} | {Kết quả} |
| 2    | Hệ thống | Kiểm tra {điều kiện} | {Phản hồi} |
| 3    | {Actor} | {Bước tiếp theo} | {Kết quả cuối} |

## 4. Các trường hợp ngoại lệ (Exception Flows)

### 4.1 {Tên exception 1}
- **Điều kiện:** {Khi nào xảy ra}
- **Hệ thống làm gì:** {Xử lý}
- **Thông báo lỗi:** "{Nội dung thông báo tiếng Việt}"
- **Error Code:** `{ERROR_CODE_CAPS}`

### 4.2 {Tên exception 2}
...

## 5. Business Rules
- `BR-01`: {Rule 1}
- `BR-02`: {Rule 2}
- ...

## 6. Tác động đến hệ thống (Side Effects)
- [ ] **Kho:** {Thay đổi tồn kho nếu có}
- [ ] **Báo cáo:** {Ảnh hưởng đến báo cáo doanh thu / kho}
- [ ] **Notification:** {Có gửi thông báo không?}
- [ ] **Audit Log:** {Ghi nhật ký thao tác nào?}
- [ ] **Realtime:** {Có cập nhật WebSocket không?}

## 7. Acceptance Criteria (Tiêu chí nghiệm thu)
```
GIVEN {trạng thái ban đầu}
WHEN  {hành động}
THEN  {kết quả mong đợi}
```
- AC-01: GIVEN bàn ở trạng thái Trống WHEN nhân viên tạo đơn THEN bàn chuyển sang Đang phục vụ
- AC-02: GIVEN nguyên liệu dưới định lượng WHEN tạo đơn THEN hệ thống reject + hiển thị thông báo rõ ràng
- AC-03: ...

## 8. API Contract (Dự kiến)
```
{METHOD} {URL}
Request: {tóm tắt request body}
Response 201: {tóm tắt response thành công}
Response 422: {error code khi business rule vi phạm}
```

## 9. Câu hỏi cần làm rõ (Open Questions)
- [ ] Q1: {Câu hỏi còn mơ hồ, cần Product Owner xác nhận}
- [ ] Q2: {Edge case chưa biết xử lý thế nào}

## 10. Ghi chú kỹ thuật
- {Lưu ý về performance nếu có}
- {Module liên quan cần thay đổi}
- {Technical debt hoặc risk}
```

---

## 📌 VÍ DỤ ĐẦY ĐỦ — "Tính năng gộp 2 bàn"

```markdown
# UC-020: Gộp 2 Bàn (Merge Table)
**Module:** order, table
**Actor:** Waiter, Cashier, Branch Manager
**Ngày tạo:** 2026-03-15
**Trạng thái:** Draft

---

## 1. Mô tả tổng quan
Cho phép nhân viên gộp 2 bàn đang có khách vào thành 1 hóa đơn chung khi khách yêu cầu ngồi cùng nhau. Tất cả món của bàn nguồn sẽ chuyển sang bàn đích.

## 2. Điều kiện tiên quyết
- [ ] Actor có quyền `order:merge-table`
- [ ] Cả 2 bàn phải thuộc cùng chi nhánh
- [ ] Bàn nguồn phải đang có đơn hàng (status = processing | pending)
- [ ] Bàn đích phải đang có đơn hàng (status = processing | pending)

## 3. Luồng chính — Happy Path
| Bước | Actor | Hành động | Hệ thống phản hồi |
|------|-------|-----------|-------------------|
| 1 | Waiter | Chọn "Gộp bàn" trên sơ đồ bàn | Hiện dialog chọn bàn đích |
| 2 | Waiter | Chọn bàn nguồn (T01) và bàn đích (T02) | Hiện preview danh sách món sau gộp |
| 3 | Waiter | Xác nhận gộp | Hệ thống kiểm tra điều kiện |
| 4 | Hệ thống | Chuyển tất cả OrderItem từ T01 → T02 | Cập nhật tổng tiền đơn T02 |
| 5 | Hệ thống | Đóng đơn T01, giải phóng bàn T01 | Bàn T01 → "Đang dọn", T02 vẫn "Đang phục vụ" |
| 6 | Hệ thống | Ghi audit log thao tác gộp bàn | Broadcast WebSocket cập nhật sơ đồ bàn |

## 4. Các trường hợp ngoại lệ

### 4.1 Bàn nguồn đã có hóa đơn thanh toán một phần
- **Điều kiện:** Một phần đơn T01 đã được thanh toán
- **Hệ thống làm gì:** Block gộp bàn
- **Thông báo lỗi:** "Không thể gộp bàn T01 vì đã có thanh toán một phần. Vui lòng hoàn tất hoặc hủy thanh toán trước."
- **Error Code:** `TABLE_PARTIAL_PAYMENT_EXISTS`

### 4.2 Bàn đích đã có Voucher khác với bàn nguồn
- **Điều kiện:** T01 dùng voucher A, T02 dùng voucher B
- **Hệ thống làm gì:** Hiện cảnh báo, hỏi nhân viên giữ voucher nào
- **Error Code:** `TABLE_MERGE_VOUCHER_CONFLICT`

### 4.3 Bàn thuộc chi nhánh khác
- **Điều kiện:** branchId của 2 bàn khác nhau
- **Thông báo lỗi:** "Chỉ có thể gộp bàn trong cùng chi nhánh"
- **Error Code:** `TABLE_CROSS_BRANCH_MERGE_NOT_ALLOWED`

## 5. Business Rules
- `BR-01`: Không gộp bàn nếu bàn nguồn chưa có đơn hàng
- `BR-02`: Không gộp bàn nếu bàn đích đang ở trạng thái "Trống"
- `BR-03`: Số bàn đích trở thành bàn chính sau gộp
- `BR-04`: Giữ lại giảm giá % của bàn đích; tính lại khuyến mãi theo menu items mới

## 6. Tác động đến hệ thống
- [ ] **Kho:** Không ảnh hưởng (đã trừ kho khi tạo đơn)
- [ ] **Báo cáo:** Đơn T01 bị merge sẽ không tính là doanh thu riêng
- [ ] **Audit Log:** Ghi: "Merge T01 → T02 bởi {staffName} lúc {timestamp}"
- [ ] **Realtime:** Broadcast WebSocket `/topic/tables/{branchId}` cập nhật status 2 bàn

## 7. Acceptance Criteria
- AC-01: GIVEN T01 có 3 món và T02 có 2 món WHEN gộp T01→T02 THEN T02 có đủ 5 món
- AC-02: GIVEN T01 đã có thanh toán một phần WHEN cố gộp THEN hệ thống reject với lỗi TABLE_PARTIAL_PAYMENT_EXISTS
- AC-03: GIVEN gộp thành công WHEN xem sơ đồ bàn THEN T01 hiển thị "Đang dọn", T02 hiển thị "Đang phục vụ"

## 8. API Contract
```
POST /api/v1/tables/merge
Request: { sourceTableId: UUID, targetTableId: UUID }
Response 200: { targetOrderId: UUID, totalItems: int, totalAmount: decimal }
Response 422: { code: "TABLE_PARTIAL_PAYMENT_EXISTS", message: "..." }
```

## 9. Câu hỏi cần làm rõ
- [ ] Q1: Nếu 2 bàn đều dùng voucher khác nhau, giữ lại voucher của bàn nào?
- [ ] Q2: Sau khi gộp, lịch sử đơn T01 có giữ lại để xem trong báo cáo không?
- [ ] Q3: Có cần tính năng tách bàn (split table) để hoàn tác không?

## 10. Ghi chú kỹ thuật
- Dùng `@Transactional` để đảm bảo gộp atomic (tất cả thành công hoặc rollback)
- Cần lock optimistic trên cả 2 Order để tránh race condition
- Command: `MergeTableCommand`, Handler: `MergeTableCommandHandler`
```
