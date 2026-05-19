# Tài liệu API POS Sessions (S-16)

> [!NOTE]
> POS Sessions (Quản lý phiên POS) được sử dụng để quản lý tiền mặt đầu ca, cuối ca của nhân viên thu ngân (Cashier). Các API này được yêu cầu gọi trước khi Cashier có thể thực hiện thanh toán.

## Base URL
`/api/v1/pos-sessions`

---

## 1. Lấy phiên POS đang mở hiện tại (Get Active Session)
Lấy thông tin của phiên làm việc POS đang ở trạng thái `OPEN` tại chi nhánh hiện tại. **Cashier cần biết session hiện tại (nếu có) trước khi bắt đầu thao tác.**

- **Method:** `GET`
- **Endpoint:** `/active`
- **Quyền yêu cầu:** `OWNER`, `ADMIN`, `BRANCH_MANAGER`, `CASHIER`

### Response
- **HTTP Status:** `200 OK`
- Dữ liệu trả về (trường `data`) là một object `PosSessionResult` hoặc `null` nếu hiện tại không có phiên POS nào đang mở.

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "openedByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "closedByUserId": null,
    "shiftScheduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "startTime": "2026-04-19T08:00:00Z",
    "endTime": null,
    "startingCash": 1000000.00,
    "endingCashExpected": 1000000.00,
    "endingCashActual": null,
    "cashDifference": null,
    "note": null,
    "status": "OPEN"
  }
}
```

---

## 2. Lấy lịch sử phiên POS (Get Session History)
Xem toàn bộ lịch sử các phiên POS của chi nhánh.

- **Method:** `GET`
- **Endpoint:** `/`
- **Quyền yêu cầu:** `OWNER`, `ADMIN`, `BRANCH_MANAGER` *(Không dành cho CASHIER)*

### Response
- **HTTP Status:** `200 OK`
- Dữ liệu trả về (trường `data`) là danh sách `List<PosSessionResult>`.

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "openedByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "closedByUserId": "1aa85f64-5717-4562-b3fc-2c963f66a111",
      "shiftScheduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "startTime": "2026-04-18T08:00:00Z",
      "endTime": "2026-04-18T16:00:00Z",
      "startingCash": 500000.00,
      "endingCashExpected": 3500000.00,
      "endingCashActual": 3500000.00,
      "cashDifference": 0.00,
      "note": "Đóng ca bình thường",
      "status": "CLOSED"
    }
  ]
}
```

---

## 3. Mở phiên POS (Open Session)
Thao tác mở phiên POS của thu ngân đầu ca. **Hệ thống sẽ từ chối nếu chi nhánh đang có một session khác đang `OPEN`.**

- **Method:** `POST`
- **Endpoint:** `/open`
- **Quyền yêu cầu:** `OWNER`, `ADMIN`, `BRANCH_MANAGER`, `CASHIER`

### Request Body (`OpenPosSessionRequest`)
- `startingCash` (Bắt buộc, `BigDecimal`): Tiền mặt có sẵn đầu ca. Phải lớn hơn hoặc bằng 0.
- `shiftScheduleId` (Tuỳ chọn, `UUID`): ID của ca làm việc có liên kết (nếu hệ thống có quản lý ca làm việc).

```json
{
  "startingCash": 1500000.00,
  "shiftScheduleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6" 
}
```

### Response
- **HTTP Status:** `201 Created`
- Trả về UUID của Session vừa được tạo.

```json
{
  "code": 200,
  "message": "Success",
  "data": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

---

## 4. Đóng phiên POS (Close Session)
Thao tác đóng phiên POS cuối ca của thu ngân sau khi đã kiểm đếm tiền mặt thực tế. Hệ thống sẽ tự động tính toán số tiền chênh lệch dựa theo `endingCashExpected` (tổng tiền gửi vào POS từ khi mở ca).

- **Method:** `POST`
- **Endpoint:** `/{id}/close`
- **Path Variable:** 
  - `id` (UUID): ID của phiên POS cần đóng.
- **Quyền yêu cầu:** `OWNER`, `ADMIN`, `BRANCH_MANAGER`, `CASHIER`

### Request Body (`ClosePosSessionRequest`)
- `endingCashActual` (Bắt buộc, `BigDecimal`): Số tiền mặt thực tế đã kiểm đếm tồn tại trong ngăn kéo lúc đóng ca. Phải lớn hơn hoặc bằng 0.
- `note` (Tuỳ chọn, `String`): Ghi chú bổ sung khi đóng ca (rất hữu ích khi có chênh lệch tiền mặt).

```json
{
  "endingCashActual": 4200000.00,
  "note": "Thiếu 10k do trả nhầm tiền thối"
}
```

### Response
- **HTTP Status:** `200 OK`
- Trả về rỗng (Data is null).

```json
{
  "code": 200,
  "message": "Success",
  "data": null
}
```

---

## 🔖 Giải thích `PosSessionResult` Model

| Trạng thái | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `id` | `UUID` | ID của session |
| `branchId` | `UUID` | ID của chi nhánh |
| `openedByUserId` | `UUID` | ID của nhân viên mở ca (Cashier) |
| `closedByUserId` | `UUID` | ID của nhân viên đóng ca. Nếu trạng thái `OPEN` thì sẽ là `null`. |
| `shiftScheduleId` | `UUID` | ID ca làm việc liên kết (`null` nếu không có lịch ca cố định) |
| `startTime` | `Instant` | Thời gian mở ca |
| `endTime` | `Instant` | Thời gian đóng ca. Nếu trạng thái `OPEN` thì sẽ là `null`. |
| `startingCash` | `BigDecimal` | Tiền mặt có trong két mốc đầu ca |
| `endingCashExpected` | `BigDecimal` | Tiền mặt ước tính cuối ca (tự động cộng dồn từ các đơn hàng nhận tiền mặt) |
| `endingCashActual` | `BigDecimal` | Tiền mặt thu ngân thực kiểm tại cuối ca |
| `cashDifference` | `BigDecimal` | Mức độ chênh lệch (`endingCashActual` - `endingCashExpected`) |
| `note` | `String` | Lời nhắn để lại khi đóng ca |
| `status` | `String` | Gồm hai trạng thái chính là `OPEN` hoặc `CLOSED` |
