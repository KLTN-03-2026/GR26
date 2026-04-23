# TÀI LIỆU TÍCH HỢP API FRONTEND (SMARTF&B S-01 -> S-18)

Tài liệu cung cấp chi tiết toàn bộ Endpoints hiện có trong dự án, bao gồm Method, Request Body, Query Params, Headers và cấu trúc Response chuẩn.

> **📊 NEW S-18: REPORT API** — Báo cáo doanh thu & sản phẩm  
> Xem chi tiết tại [S18_FRONTEND_INTEGRATION.md](./S18_FRONTEND_INTEGRATION.md)

> **💡 Quy tắc chung:**
>
> - Toàn bộ API (ngoại trừ `/register`, `/login`, và `/pin-login`, quên mật khẩu) đều yêu cầu Header: `Authorization: Bearer <access_token>`.
> - Format Response chuẩn của Backend (áp dụng cho mọi API):
>   ```json
>   {
>     "success": true, // hoặc false
>     "data": { ... }, // Dữ liệu trả về khi success = true
>     "error": null,   // Hoặc object { "code": "...", "message": "..." } khi success = false
>     "timestamp": "2026-03-30T10:00:00Z"
>   }
>   ```

---

## 🔐 1. MODULE XÁC THỰC (AUTH) - Prefix: `/api/v1/auth`

### 1.1 Đăng ký Tenant mới (Chủ quán)

- **Method:** `POST /register`
- **Request Body:**
  ```json
  {
    "tenantName": "Cà phê Phúc Long", // Bắt buộc, max 255 char
    "email": "owner@phuclong.vn", // Bắt buộc, valid email
    "password": "Password123!", // Bắt buộc, min 8 char
    "ownerName": "Nguyễn Văn A", // Bắt buộc, max 255 char
    "phone": "0987654321", // Tùy chọn
    "planSlug": "standard" // Bắt buộc (basic | standard | premium)
  }
  ```
- **Response `data`:**
  ```json
  {
    "accessToken": "ey...",
    "refreshToken": "ey...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "userId": "uuid",
    "tenantId": "uuid",
    "role": "OWNER",
    "branchId": "uuid-chi-nhanh", // null nếu chưa chọn chi nhánh
    "branchName": "Tên chi nhánh", // null nếu chưa chọn chi nhánh
    "fullName": "Nguyễn Văn A"
  }
  ```

### 1.2 Đăng nhập (Email/Password)

- **Method:** `POST /login`
- **Request Body:**
  ```json
  {
    "email": "owner@phuclong.vn",
    "password": "Password123!"
  }
  ```
- **Response `data`:** Tương tự `register`, trả về Access Token + Refresh Token.

### 1.3 Đăng nhập POS (Bằng PIN cho Cashier/Barista)

- **Method:** `POST /pin-login`
- **Request Body:**
  ```json
  {
    "tenantId": "uuid-cua-tenant",
    "userId": "uuid-cua-nhan-vien",
    "pin": "123456" // PIN 4-6 số
  }
  ```
- **Response `data`:** Tương tự `login`.

- **Model Note:** Khi làm mới token, bạn CẦN gửi kèm `branchId` (chọn từ trước) để Backend duy trì context chi nhánh trong access token mới. Nếu không gửi, token sẽ không có quyền thao tác trên chi nhánh.
- **Role Note:** Token mới được cấp SẼ VẪN CHỨA QUYỀN (`role`, `permissions`) hiện tại của Account trong DB.

- **Method:** `POST /refresh`
- **Request Body:**
  ```json
  {
    "refreshToken": "ey...", // Token được lấy từ lúc login
    "branchId": "uuid-chi-nhanh" // (Optional) Truyền ID chi nhánh đang làm việc để giữ branch context
  }
  ```
- **Response `data`:** Cấp lại Access Token và Refresh Token mới. (Role, FullName và thông tin Branch vẫn được trả ra tương tự như lúc Login).

### 1.5 Đổi Scope làm việc sang 1 Chi nhánh

- **Method:** `POST /select-branch`
- **Headers:** Bắt buộc có Access Token hiện tại
- **Request Body:**
  ```json
  {
    "branchId": "uuid-cua-chi-nhanh"
  }
  ```
- **Response `data`:** Trả về Token mới có chứa đầy đủ thông tin `branchId`, `branchName` và `fullName`. FE lưu lại token này để gọi các API POS tiếp theo.

### 1.6 Quên mật khẩu (Flow 3 bước)

- `POST /forgot-password`
  - **Body:** `{ "email": "user@email.com" }` -> Server gửi mã OTP 6 số.
- `POST /verify-otp`
  - **Body:** `{ "email": "user@email.com", "otp": "123456" }`
  - **Response `data`:** `{ "resetToken": "token-tam-thoi-15-phut" }`
- `POST /reset-password`
  - **Body:** `{ "email": "user@email.com", "resetToken": "token-tam-thoi...", "newPassword": "NewPassword123!" }`

---

## 💳 2. MODULE KẾ HOẠCH & SUBSCRIPTION - Prefix: `/api/v1/plans` & `/api/v1/subscriptions`

### 2.1 Lấy danh sách Gói cước (Dùng ở trang Đăng ký)

- **Method:** `GET /api/v1/plans`
- **Response `data`:** Array các Object:
  `[{ "id": "uuid", "name": "Standard", "slug": "standard", "priceMonthly": 500000, "maxBranches": 3, "features": {"POS": true, "INVENTORY": true} }]`

### 2.2 Xem thông tin gói cước đang dùng

- **Method:** `GET /api/v1/subscriptions/current`
- **Headers:** Bắt buộc có Token (của Owner)
- **Response `data`:**
  `{ "id": "uuid", "plan": {...}, "status": "ACTIVE", "startDate": "...", "endDate": "..." }`

---

## 🏢 3. MODULE CHI NHÁNH (BRANCH) - Prefix: `/api/v1/branches`

### 3.1 Lấy danh sách Chi nhánh của Tenant

- **Method:** `GET /`
- **Response `data`:** `[{ "id": "uuid", "name": "Chi nhánh 1", "code": "CN01", "address": "...", "status": "ACTIVE" }]`

### 3.2 Tạo Chi nhánh mới

- **Method:** `POST /`
- **Request Body:**
  ```json
  {
    "name": "Chi nhánh Bùi Viện", // Bắt buộc
    "code": "BV01", // Bắt buộc, unique
    "address": "Phố Bùi Viện, Q1",
    "phone": "0123456789",
    "latitude": 10.767, // Tùy chọn
    "longitude": 106.693, // Tùy chọn
    "managerUserId": "uuid-quan-ly" // Tùy chọn
  }
  ```
- **Response `data`:** Object Branch vừa tạo. `PUT /{branchId}` dùng chung Body.

### 3.3 Gán nhân viên vào Chi nhánh

- **Method:** `POST /{branchId}/users`
- **Request Body:** `{ "userId": "uuid-nhan-vien" }`

---

## 🍔 4. MODULE THỰC ĐƠN (MENU) - Prefix: `/api/v1/menu`

### 4.1 Danh mục (Categories)

- `GET /categories` - Lấy danh sách (Query Params: `?page=0&size=20&keyword=...`) -> Trả về JSON chứa `content`, `totalPages`, `totalElements`.
- `GET /categories/active` - Lấy toàn bộ không phân trang (chỉ Active).
- `POST /categories` - Tạo mới:
  ```json
  {
    "name": "Cà Phê", // Bắt buộc
    "description": "Các loại cafe pha máy",
    "displayOrder": 1,
    "isActive": true
  }
  ```
- `PUT /categories/{id}` & `DELETE /categories/{id}`

### 4.2 Món Ăn / Đồ Uống (Items)

- `GET /items` - List phân trang (có query `keyword` tìm theo pg_trgm).
- `GET /items/active` - Lấy ds món đang bán cho màn hình POS.
- `GET /items/{id}/recipe` - Xem công thức của món ăn.

#### `POST /items` — Tạo món mới (Upload ảnh từ máy)

> **⚠️ BREAKING CHANGE**: API dùng `multipart/form-data` thay vì `application/json`.
> FE phải gửi 2 parts: `data` (JSON) và `image` (file — tùy chọn).

- **Content-Type:** `multipart/form-data`
- **Part `data`** (bắt buộc, Content-Type: `application/json`):
  ```json
  {
    "categoryId": "uuid-hoặc-null",
    "name": "Cà phê Sữa Đá",
    "basePrice": 35000,
    "unit": "Ly",
    "isSyncDelivery": false
  }
  ```
- **Part `image`** (tùy chọn): File ảnh JPEG/PNG/WebP, tối đa 5MB.
- **Response `data`:** Object MenuItem với `imageUrl` là URL đầy đủ tới ảnh.

**Ví dụ curl:**

```bash
curl -X POST http://localhost:8080/api/v1/menu/items \
  -H "Authorization: Bearer <token>" \
  -F 'data={"name":"Cà phê Sữa Đá","basePrice":35000,"unit":"Ly","isSyncDelivery":false};type=application/json' \
  -F 'image=@/path/to/photo.jpg'
```

**Ví dụ JavaScript (FormData):**

```javascript
const formData = new FormData();
formData.append(
  "data",
  new Blob(
    [
      JSON.stringify({
        name: "Cà phê Sữa Đá",
        basePrice: 35000,
        unit: "Ly",
        isSyncDelivery: false,
      }),
    ],
    { type: "application/json" },
  ),
);

if (imageFile) {
  formData.append("image", imageFile); // File từ <input type="file">
}

const res = await fetch("/api/v1/menu/items", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
  // KHÔNG set Content-Type — browser tự set boundary
});
```

#### `PUT /items/{id}` — Cập nhật món (thay ảnh nếu có)

- **Content-Type:** `multipart/form-data`
- **Part `data`** (bắt buộc):
  ```json
  {
    "categoryId": "uuid-hoặc-null",
    "name": "Tên mới",
    "basePrice": 38000,
    "unit": "Ly",
    "isActive": true,
    "isSyncDelivery": false
  }
  ```
- **Part `image`** (tùy chọn): Nếu không gửi → giữ nguyên ảnh cũ.

#### `DELETE /items/{id}` — Xóa món (soft delete)

#### Lỗi có thể nhận:

| errorCode                  | Mô tả                                 |
| -------------------------- | ------------------------------------- |
| `INVALID_IMAGE`            | Sai định dạng ảnh (chỉ JPEG/PNG/WebP) |
| `FILE_TOO_LARGE`           | Ảnh vượt quá 5MB                      |
| `DUPLICATE_MENU_ITEM_NAME` | Tên món đã tồn tại trong tenant       |

#### Xem ảnh món ăn (Public — không cần JWT):

```
GET /api/v1/files/{filename}
```

`imageUrl` trong response là URL đầy đủ, FE dùng trực tiếp làm src của `<img>`.

### 4.3 Giá món riêng cho từng Chi Nhánh (Branch Items)

- `GET /branches/{branchId}/items/{itemId}` - Lấy giá cụ thể tại một chi nhánh.
- `PUT /branches/{branchId}/items/{itemId}/price` - Thiết lập giá Over-ride:
  ```json
  {
    "branchPrice": 45000, // Nếu null -> Sẽ lấy lại basePrice từ bảng Items
    "isAvailable": true // Tắt bật món này tại riêng chi nhánh đó
  }
  ```

### 4.4 Addons (Topping)

- `GET /addons` & `GET /addons/active`.
- `POST /addons` - Tạo topping:
  ```json
  {
    "name": "Trân châu đen", // Bắt buộc
    "extraPrice": 5000, // Bắt buộc
    "isActive": true
  }
  ```
- `PUT /addons/{id}` & `DELETE /addons/{id}`.

### 4.5 Công thức Pha chế (Recipe)

- `POST /recipes` - Thêm nguyên liệu định lượng:
  ```json
  {
    "targetItemId": "uuid-mon-ban",
    "ingredientItemId": "uuid-nguyen-lieu",
    "quantity": 25.5, // Số lượng (vd: lấy 25.5 gram đường)
    "unit": "gram"
  }
  ```
- `PUT /recipes/{recipeId}` - Sửa số lượng `{"quantity": 30.0, "unit": "gram"}`
- `DELETE /recipes/{recipeId}` - Xóa liên kết công thức.

---

## 🪑 5. SƠ ĐỒ BÀN (TABLES & ZONES) - Prefix: `/api/v1/branches/{branchId}`

_(Yêu cầu URL luôn chứa `branchId` hiện tại của người thao tác)_

### 5.1 Quản lý Khu Vực (Zones)

- `GET /zones` - Lấy danh sách Zone.
- `POST /zones`
  ```json
  {
    "name": "Tầng 1", // Bắt buộc (Tên khu vực)
    "floorNumber": 1 // Số định danh tầng (để sắp xếp)
  }
  ```
- `PUT /zones/{zoneId}` & `DELETE /zones/{zoneId}`

### 5.2 Quản lý Sơ đồ Bàn (Tables)

> **Permission Note:** Các thao tác xem Sơ đồ Bàn yêu cầu quyền `TABLE_VIEW`. Các thao tác CRUD (Tạo, Sửa, Xóa, kéo thả) yêu cầu quyền `TABLE_EDIT`. (Hệ thống đã tự động cấp các quyền này cho các role cũ dựa trên `ORDER_VIEW` và `BRANCH_EDIT`).

- `GET /tables` - Lấy array List trải phẳng các bàn (chứa `id`, `name`, `status`, `zoneId`, `positionX`, `positionY`, `shape`) -> Render giao diện Grid kéo thả.
- `GET /tables/stats/occupied-count` - Widget: Đếm số bàn có khách (OCCUPIED).
- `POST /tables` - Tạo Bàn (Thả bàn mới vào giao diện):
  ```json
  {
    "zoneId": "uuid-khu-vuc", // Có thể null
    "name": "Bàn A1", // Bắt buộc, max 50 char
    "capacity": 4, // Sức chứa, > 0
    "shape": "square" // Bắt buộc: "square" (Vuông) hoặc "round" (Tròn)
  }
  ```

### 5.3 Batch Update Layout (Drag & Drop Realtime) - RẤT QUAN TRỌNG

- **Method:** `PUT /tables/positions`
- **Mô tả:** Sau khi User kéo thẻ bàn tới vị trí mới trên sơ đồ và thả tay, FE gửi mảng tọa độ lên endpoint này. Backend sẽ lưu lại và kích hoạt event WebSocket `/topic/tables/{branchId}` để các màn hình khác cập nhật ngay lập tức.
- **Request Body:**
  ```json
  {
    "tables": [
      {
        "tableId": "uuid-ban-a1",
        "positionX": 150.5,
        "positionY": 200.0
      },
      {
        "tableId": "uuid-ban-a2",
        "positionX": 300.25,
        "positionY": 200.0
      }
    ]
  }
  ```
- **Response:** Không trả data (`200 OK` rỗng). Listen trên WebSocket để update UI local.

---

## 🍽️ 6. MODULE ĐƠN HÀNG (ORDER) - S-10: Order Realtime WebSocket - Prefix: `/api/v1/orders`

### 6.1 Tạo Đơn Hàng mới

- **Method:** `POST /`
- **Headers:** Bearer Token
- **Request Body:**
  ```json
  {
    "tableId": "uuid-ban-a1", // Bàn hiện tại (hoặc null nếu delivery)
    "source": "IN_STORE", // Enum: IN_STORE | DELIVERY | TAKEAWAY
    "notes": "Không dá, ít đường",
    "items": [
      {
        "itemId": "uuid-item-cafe",
        "itemName": "Cà phê Sữa Đá",
        "quantity": 2,
        "unitPrice": 35000,
        "addons": ["Trân châu đen"], // Tùy chọn, array tên addons
        "notes": "Ít dá"
      }
    ]
  }
  ```
- **Response `data`:**
  ```json
  {
    "id": "uuid-order",
    "orderNumber": "ORD-ABC1-260331153042", // Auto generate
    "tableId": "uuid-ban-a1",
    "status": "PENDING", // Trạng thái mới
    "subtotal": 70000,
    "discountAmount": 0,
    "totalAmount": 70000,
    "items": [
      {
        "id": "uuid-item",
        "itemId": "uuid-item-cafe",
        "itemName": "Cà phê Sữa Đá",
        "quantity": 2,
        "unitPrice": 35000,
        "totalPrice": 70000,
        "status": "PENDING"
      }
    ]
  }
  ```

### 6.2 Cập nhật Trạng thái Đơn Hàng (REST API)

- **Method:** `PUT /{orderId}/status`
- **Headers:** Bearer Token
- **Request Body:**
  ```json
  {
    "newStatus": "PROCESSING", // Enum: PENDING | PROCESSING | COMPLETED | CANCELLED
    "reason": "Bếp đang pha chế" // Tùy chọn, ghi log lý do
  }
  ```
- **Response `data`:** Object OrderResponse như trên, status đã cập nhật.
- **Broadcast WebSocket:** Sau khi API trả about, Backend auto-triggerOrderStatusChangedEvent → broadcast tới `/topic/orders/{branchId}` để tất cả client nghe được realtime.

### 6.3 Hủy Đơn Hàng

- **Method:** `POST /{orderId}/cancel`
- **Headers:** Bearer Token
- **Request Body:**
  ```json
  {
    "reason": "Khách không đủ tiền"
  }
  ```
- **Response `data`:** OrderResponse với status = CANCELLED.

### 6.4 Xem Chi tiết Đơn Hàng

- **Method:** `GET /{orderId}`
- **Headers:** Bearer Token
- **Response `data`:** OrderResponse chi tiết.

### 6.5 Danh sách Đơn Hàng (Lọc & Phân trang)

- **Method:** `GET /`
- **Query Params:**
  - `status=PENDING` → Lọc theo trạng thái
  - `from=2026-03-31T00:00:00Z` → Từ ngày
  - `to=2026-03-31T23:59:59Z` → Đến ngày
  - `tableId=uuid` → Lọc theo bàn
  - `page=0&size=20` → Phân trang
- **Response `data`:** Array Object + pagination metadata.

### 6.6 WebSocket Realtime: Subscribe Broadcast

> **✅ Bắt BUỘC là Feature S-10 — Realtime WebSocket cho tất cả client**

#### Kết nối WebSocket:

```javascript
// Frontend JavaScript (ví dụ)
// Endpoint: ws://localhost:8080/ws
const url = `ws://${window.location.hostname}:${window.location.port || 8080}/ws`;
const sockJS = new SockJS(url);
const stompClient = Stomp.over(sockJS);

stompClient.connect(
  {},
  function () {
    console.log("✅ WebSocket connected");

    // Subscribe broadcast mới trạng thái đơn hàng
    stompClient.subscribe(`/topic/orders/${branchId}`, function (message) {
      const orderUpdate = JSON.parse(message.body);
      console.log("📡 Nhận cập nhật đơn:", orderUpdate);
      // Update UI ngay lập tức
      updateOrderOnUI(orderUpdate);
    });

    // (Optional) Gửi message để cập nhật status qua WebSocket
    // Có thể dùng HTTP PUT /orders/{id}/status là đủ
    // const updateMsg = {
    //   orderId: "...",
    //   newStatus: "PROCESSING",
    //   reason: "Bếp vạn pha chế"
    // };
    // stompClient.send("/app/orders/change-status", {}, JSON.stringify(updateMsg));
  },
  function (error) {
    console.error("WebSocket error:", error);
  },
);
```

#### Topic broadcast:

- **Topic:** `/topic/orders/{branchId}`
  - Khi bất kỳ đơn hàng nào tại `{branchId}` thay đổi, backend publish OrderResponse mới tới topic này.
  - Tất cả client subscribe topic này đều nhận được update realtime.

#### Events trigger broadcast:

| Event                   | Trigger                                              | Broadcast Content                  |
| ----------------------- | ---------------------------------------------------- | ---------------------------------- |
| OrderCreatedEvent       | API POST /api/v1/orders → tạo đơn mới                | OrderResponse (status = PENDING)   |
| OrderStatusChangedEvent | API PUT /api/v1/orders/{id}/status → cập nhật status | OrderResponse (status đã thay đổi) |
| OrderCompletedEvent     | API cập nhật sang COMPLETED                          | OrderResponse (status = COMPLETED) |
| OrderCancelledEvent     | API POST /api/v1/orders/{id}/cancel                  | OrderResponse (status = CANCELLED) |

#### Ghi chú quan trọng:

1. **Bếp (Kitchen Display System):** Subscribe `/topic/orders/{branchId}` + show những order có status=PENDING hoặc PROCESSING.
2. **Quầy (Checkout):** Subscribe `/topic/orders/{branchId}` + show hoàn tất → tính tiền → thanh toán.
3. **Waiter:** Subscribe `/topic/orders/{branchId}` + show từng item trong order → phục vụ từng phần.
4. **Quản lý:** Có thể không subscribe, chỉ query API `GET /api/v1/orders` định kỳ hoặc theo nhu cầu.

### 6.7 Cập nhật thông tin đơn hàng (Sửa món/Bàn/Ghi chú)

- **Method:** `PUT /{orderId}`
- **Headers:** Bearer Token
- **Mô tả:** Cho phép nhân viên sửa thông tin bàn, ghi chú hoặc thay đổi danh sách món ăn (thêm món, bớt món, đổi số lượng).
- **⚠️ Lưu ý quan trọng:** API này sử dụng cơ chế **đồng bộ toàn phần** danh sách món ăn.
  - Những món có `id` trùng với món đang có trong đơn: Sẽ được cập nhật thông tin.
  - Những món **không có id**: Sẽ được thêm mới vào đơn.
  - Những món đang có trong đơn nhưng **không xuất hiện** trong request này: Sẽ bị **xoá hẳn** khỏi đơn hàng.
- **Request Body:**
  ```json
  {
    "tableId": "uuid-ban-moi",
    "notes": "Ghi chú đã sửa",
    "items": [
      {
        "id": "uuid-item-dang-co-trong-don", // Bắt buộc nếu muốn cập nhật món cũ
        "itemId": "uuid-mon-an",
        "itemName": "Cà phê Sữa Đá",
        "quantity": 3,
        "unitPrice": 35000,
        "addons": "Ít đá",
        "notes": "Làm nhanh"
      },
      {
        "itemId": "uuid-mon-moi", // Thêm món mới vào đơn
        "itemName": "Bánh mì quay",
        "quantity": 1,
        "unitPrice": 25000
      }
    ]
  }
  ```
- **Response `data`:** Object OrderResponse với các thông tin và `totalAmount` đã được cập nhật.
- **Broadcast WebSocket:** Tự động bắn event `OrderUpdatedEvent` để các màn hình khác (Bếp/Thu ngân) nhận được thông báo thay đổi.

---

## 📦 7. MODULE THANH TOÁN (PAYMENT) - Prefix: `/api/v1/payments` & `/api/v1/invoices`

> Đã hoàn thành S-11 & S-12. Xem chi tiết trong codebase.

### 7.1 Xác nhận Chuyển khoản (Thủ công)
- **Method:** `POST /api/v1/payments/{paymentId}/confirm`
- **Quyền:** `PAYMENT_CREATE` hoặc `OWNER`, `BRANCH_MANAGER`, `CASHIER`
- **Mô tả:** API phục vụ khi Thu ngân muốn bấm xác nhận thủ công trên app (ví dụ như chụp bill chuyển khoản, kiểm tra biến động số dư cá nhân) khi webhook ngân hàng bị lỗi.
- **Response:** `200 OK`. Tự động đẩy đơn hàng sang COMPLETED và sinh `PaymentCompletedEvent` (WebSocket).

---

## 🏭 8. MODULE KHO NGUYÊN LIỆU (INVENTORY) - S-13 & S-14 - Prefix: `/api/v1/inventory`

> **Phân quyền cần có trong JWT:**
>
> - `INVENTORY_VIEW` — OWNER, ADMIN, BRANCH_MANAGER
> - `INVENTORY_IMPORT` — OWNER, ADMIN, BRANCH_MANAGER
> - `INVENTORY_ADJUST` — OWNER, ADMIN
> - `INVENTORY_WASTE` — OWNER, ADMIN, BRANCH_MANAGER

### 8.1 Nhập Kho Nguyên Liệu (S-13)

Tạo lô hàng nhập mới (`StockBatch`). Tự động cộng vào `inventory_balances`. Hệ thống ghi `inventory_transactions` (type=IMPORT) và publish `StockImportedEvent`.

- **Method:** `POST /api/v1/inventory/import`
- **Headers:** `Authorization: Bearer <token>` (cần `INVENTORY_IMPORT`)
- **Request Body:**
  ```json
  {
    "itemId": "uuid-nguyen-lieu",
    "supplierId": "uuid-nha-cung-cap", // Tùy chọn
    "quantity": 100.5, // Bắt buộc, > 0
    "costPerUnit": 12000.0, // Bắt buộc, >= 0
    "expiresAt": "2026-06-30T00:00:00Z", // Tùy chọn (hạn sử dụng lô hàng)
    "note": "Nhập từ kho Hà Nội" // Tùy chọn
  }
  ```
- **Response `data`:** UUID của `StockBatch` vừa tạo.
  ```json
  "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ```
- **HTTP Status:** `201 Created`

### 8.2 Điều Chỉnh Kho Thủ Công (S-14)

Set lại số lượng tuyệt đối cho tồn kho. **Bắt buộc** phải truyền `reason`. Hệ thống tự động ghi `audit_logs` và `inventory_transactions` (type=ADJUSTMENT).

- **Method:** `POST /api/v1/inventory/adjust`
- **Headers:** `Authorization: Bearer <token>` (cần `INVENTORY_ADJUST`)
- **Request Body:**
  ```json
  {
    "itemId": "uuid-nguyen-lieu",
    "newQuantity": 85.5, // Giá trị tuyệt đối mới (>= 0)
    "reason": "Kiểm kê cuối tháng phát hiện thừa/thiếu" // Bắt buộc
  }
  ```
- **Response:** `200 OK` với `data: null` (không có data trả về)
- **Lưu ý:** Backend tính delta = newQuantity - currentQuantity tự động. FE chỉ cần gửi số lượng mới muốn set.

### 8.3 Ghi Nhận Hao Hụt Nguyên Liệu (S-14)

Ghi nhận nguyên liệu bị hỏng, rơi vỡ, hết hạn... Hệ thống giảm tồn kho và ghi `audit_logs` + `inventory_transactions` (type=WASTE).

- **Method:** `POST /api/v1/inventory/waste`
- **Headers:** `Authorization: Bearer <token>` (cần `INVENTORY_WASTE`)
- **Request Body:**
  ```json
  {
    "itemId": "uuid-nguyen-lieu",
    "quantity": 2.5, // Số lượng hao hụt (> 0)
    "reason": "Hết hạn sử dụng" // Bắt buộc
  }
  ```
- **Response:** `200 OK` với `data: null`
- **Nếu lỗi không đủ kho:** `422 Unprocessable Entity`
  ```json
  {
    "success": false,
    "error": {
      "code": "INSUFFICIENT_STOCK",
      "message": "Nguyên liệu '...' không đủ. Cần 2.5000, hiện còn 1.0000"
    }
  }
  ```

### 8.4 Xem Tồn Kho Theo Chi Nhánh (S-14)

Danh sách phân trang. **OWNER** thấy tất cả chi nhánh trong tenant. **Các role khác** chỉ thấy chi nhánh đang làm việc (tự động filter theo JWT).

- **Method:** `GET /api/v1/inventory`
- **Headers:** `Authorization: Bearer <token>` (cần `INVENTORY_VIEW`)
- **Query Params:** `?page=0&size=20`
- **Response `data`:**
  ```json
  {
    "content": [
      {
        "id": "uuid-balance",
        "branchId": "uuid-chi-nhanh",
        "itemId": "uuid-nguyen-lieu",
        "itemName": "Cà phê Arabica",
        "unit": "g",
        "quantity": 850.5,
        "minLevel": 500.0,
        "isLowStock": false, // true nếu quantity <= minLevel
        "updatedAt": "2026-04-03T09:00:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 45,
    "totalPages": 3
  }
  ```

> **💡 Tip cho FE:** Highlight màu đỏ những dòng có `isLowStock: true` để cảnh báo branch manager cần đặt hàng thêm.

### 8.5 Cơ Chế Tự Động (Không Cần FE Gọi)

| Sự kiện               | Trigger                   | Kết quả                                        |
| --------------------- | ------------------------- | ---------------------------------------------- |
| `OrderCompletedEvent` | Đơn hàng chuyển COMPLETED | Tự động trừ kho theo công thức (FIFO)          |
| `LowStockAlertEvent`  | Tồn kho <= min_level      | Broadcast cảnh báo (Phase 2: gửi notification) |
| `StockImportedEvent`  | Nhập kho mới              | Report module cập nhật báo cáo kho             |

---

## 👨‍💼 9. MODULE QUẢN LÝ NHÂN VIÊN (STAFF) - S-15 - Prefix: `/api/v1/staff`

> **Phân quyền (JWT Role):**
>
> - `OWNER`, `ADMIN` — Toàn quyền (tạo, sửa, xóa, khóa/mở khóa, gán roles)
> - `BRANCH_MANAGER` — Chỉ xem danh sách và chi tiết

### 9.1 Danh sách nhân viên (có phân trang và filter)

- **Method:** `GET /api/v1/staff`
- **Query Params:**
  - `positionId=uuid` — Lọc theo chức vụ (tùy chọn)
  - `status=ACTIVE|INACTIVE` — Lọc theo trạng thái (tùy chọn)
  - `keyword=abc` — Tìm kiếm theo tên/email/mã NV (tùy chọn)
  - `page=0&size=20` — Phân trang
- **Response `data`:** `Page<StaffSummaryResult>` — object phân trang

### 9.2 Chi tiết nhân viên

- **Method:** `GET /api/v1/staff/{id}`
- **Response `data`:** Object chi tiết nhân viên kèm roles

### 9.3 Tạo nhân viên mới

- **Method:** `POST /api/v1/staff`
- **Quyền:** `OWNER`, `ADMIN`
- **Request Body:**
  ```json
  {
    "fullName": "Nguyễn Văn A", // Bắt buộc
    "phone": "0987654321", // Tùy chọn, duy nhất trong tenant
    "email": "nva@coffee.vn", // Tùy chọn
    "positionId": "uuid-chuc-vu", // Tùy chọn
    "employeeCode": "NV001", // Tùy chọn, max 50 ký tự
    "hireDate": "2026-01-15", // Tùy chọn
    "dateOfBirth": "1998-05-20", // Tùy chọn
    "gender": "MALE", // Tùy chọn: MALE | FEMALE | OTHER
    "address": "123 Đường ABC, Q1", // Tùy chọn
    "password": "Password123!", // Tùy chọn, mật khẩu để nhân viên đăng nhập email (8-255 ký tự)
    "posPin": "123456" // Tùy chọn, mã PIN 4-6 số để nhân viên đăng nhập nhanh POS
  }
  ```
- **Response `data`:** UUID của nhân viên vừa tạo
- **HTTP Status:** `201 Created`

### 9.4 Cập nhật thông tin nhân viên

- **Method:** `PUT /api/v1/staff/{id}`
- **Quyền:** `OWNER`, `ADMIN`
- **Ghi chú:** Tất cả fields đều optional (partial update — chỉ field nào gửi mới được cập nhật). Kể cả `password` và `posPin`, nếu được gửi qua, sẽ cập nhật lại thông tin đăng nhập của nhân viên.
- **Request Body:** Tương tự 9.3 (không bắt buộc field nào, có thể truyền `password` và `posPin` mới vào đây).
- **Response:** `200 OK` với `data: null`

### 9.5 🔒 Khóa / Mở khóa nhân viên _(BUG FIX — Mới thêm)_

> **⚠️ PHÂN BIỆT RÕ: Khóa (PATCH) vs Xóa mềm (DELETE)**
>
> | Hành động        | Endpoint                   | Kết quả                                                                                      |
> | ---------------- | -------------------------- | -------------------------------------------------------------------------------------------- |
> | **Khóa/Mở khóa** | `PATCH /staff/{id}/status` | Chỉ thay đổi `status`. Nhân viên vẫn tồn tại, tìm được với `?status=INACTIVE`                |
> | **Xóa mềm**      | `DELETE /staff/{id}`       | Set `deleted_at`, nhân viên **ẩn hoàn toàn** khỏi mọi query, **không thể khôi phục qua API** |

- **Method:** `PATCH /api/v1/staff/{id}/status`
- **Quyền:** `OWNER`, `ADMIN`
- **Request Body:**
  ```json
  {
    "status": "INACTIVE", // Bắt buộc: ACTIVE | INACTIVE
    "reason": "Nhân viên xin nghỉ phép dài hạn" // Bắt buộc, max 500 ký tự
  }
  ```
- **Response:** `200 OK` với `data: null`
- **Idempotent:** Gửi status trùng trạng thái hiện tại → `200 OK` không làm gì (không lỗi)
- **Lỗi có thể nhận:**

  | errorCode         | HTTP | Mô tả                                                            |
  | ----------------- | ---- | ---------------------------------------------------------------- |
  | `STAFF_NOT_FOUND` | 404  | Không tìm thấy nhân viên (đã bị xóa mềm hoặc không thuộc tenant) |

**Ví dụ — Khóa nhân viên:**

```javascript
await fetch(`/api/v1/staff/${staffId}/status`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    status: "INACTIVE",
    reason: "Nhân viên vi phạm nội quy, đang xử lý kỷ luật",
  }),
});
```

**Ví dụ — Mở khóa nhân viên:**

```javascript
await fetch(`/api/v1/staff/${staffId}/status`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    status: "ACTIVE",
    reason: "Xử lý kỷ luật xong, nhân viên quay lại làm việc",
  }),
});
```

### 9.6 Xóa mềm nhân viên (không khôi phục được)

- **Method:** `DELETE /api/v1/staff/{id}`
- **Quyền:** Chỉ `OWNER`
- **Request Body:**
  ```json
  {
    "reason": "Nhân viên nghỉ việc chính thức" // Bắt buộc, max 500 ký tự
  }
  ```
- **Response:** `200 OK` với `data: null`
- **⚠️ Lưu ý:** Sau khi xóa mềm, nhân viên **không thể tìm thấy** qua bất kỳ API nào. Dùng `PATCH /status` nếu chỉ muốn khóa tạm thời.

### 9.7 Gán vai trò cho nhân viên

- **Method:** `PUT /api/v1/staff/{id}/roles`
- **Quyền:** Chỉ `OWNER`
- **Ghi chú:** Thay thế toàn bộ danh sách roles (replace-all, không phải append)
- **Request Body:**
  ```json
  {
    "roleIds": ["uuid-role-1", "uuid-role-2"]
  }
  ```
- **Response:** `200 OK` với `data: null`

---

## 💸 10. MODULE QUẢN LÝ CHI TIÊU (EXPENSE) - Prefix: `/api/v1/expenses`

> **Phân quyền (JWT Role):**
>
> - `EXPENSE_MANAGE` (hoặc `OWNER`, `BRANCH_MANAGER`) — Tạo, sửa, xóa phiếu chi.
> - `EXPENSE_VIEW` (hoặc `OWNER`, `BRANCH_MANAGER`, `CASHIER`) — Xem danh sách phiếu chi tại chi nhánh.

### 10.1 Tạo Phiếu Chi (Hóa đơn chi)

- **Method:** `POST /`
- **Quyền:** `EXPENSE_MANAGE`
- **Request Body:**
  ```json
  {
    "amount": 500000.0, // Bắt buộc, > 0
    "categoryName": "Mua nguyên liệu", // Bắt buộc
    "description": "Mua thêm cà phê hạt", 
    "expenseDate": "2026-04-17T10:00:00Z", // Bắt buộc
    "paymentMethod": "CASH" // Bắt buộc (CASH | TRANSFER | ...)
  }
  ```
- **Response `data`:** UUID của phiếu chi vừa tạo.
- **HTTP Status:** `201 Created`

### 10.2 Cập nhật Phiếu Chi

- **Method:** `PUT /{id}`
- **Quyền:** `EXPENSE_MANAGE` 
- **Request Body:** Tương tự API POST.
- **Response:** `200 OK` (data: `null`)
- **Lưu ý:** Không thể sửa nếu phiếu chi đã bị hủy.

### 10.3 Hủy / Xóa mềm Phiếu Chi

- **Method:** `DELETE /{id}`
- **Quyền:** `EXPENSE_MANAGE`
- **Lưu ý:** Set trạng thái deleted = true. Không thể thao tác trên hóa đơn đã bị hủy trước đó.

### 10.4 Danh sách Phiếu Chi

- **Method:** `GET /`
- **Quyền:** `EXPENSE_VIEW`
- **Query Params:**
  - `categoryName=abc` — Tìm kiếm theo hạng mục (tuỳ chọn)
  - `page=0&size=20` — Phân trang
- **Response `data`:** Danh sách phân trang `PageResponse`.

---

## 📊 🚀 TỔNG LỊCH PHÁT HÀNH (TIMELINE)

| Sprint       | Module                                        | Status           |
| ------------ | --------------------------------------------- | ---------------- |
| S-01 to S-08 | Auth, Branch, Menu, Table, Subscription, RBAC | ✅ Hoàn thành    |
| S-09         | Inventory (cơ bản)                            | ✅ Hoàn thành    |
| S-10         | Order Realtime WebSocket                      | ✅ Hoàn thành    |
| S-11 & S-12  | Payment & Invoice                             | ✅ Hoàn thành    |
| **S-13**     | **Inventory — Nhập kho & FIFO**               | ✅ **COMPLETED** |
| **S-14**     | **Inventory — Điều chỉnh, Hao hụt, Cảnh báo** | ✅ **COMPLETED** |
| **S-15**     | **Staff Management — Bug Fix: PATCH /status** | ✅ **COMPLETED** |
| S-16+        | Shift, Report, Supplier modules               | ✅ Hoàn thành    |
| **S-ACC**    | **Account Management — Profile CRUD cá nhân** | ✅ **COMPLETED** |

---

## 👤 11. MODULE TÀI KHOẢN CÁ NHÂN (ACCOUNT) — Prefix: `/api/v1/account`

> **Mục đích:** Mỗi user tự quản lý tài khoản của mình — không yêu cầu quyền đặc biệt nào nất, chỉ cần JWT hợp lệ.
> **Security:** `userId` và `tenantId` lấy từ JWT — client không thể tự đặt giá trị này.

### 11.1 Lấy Profile Cá Nhân

- **Method:** `GET /api/v1/account/me`
- **Headers:** `Authorization: Bearer <access_token>` (bắt buộc)
- **Request Body:** _Không cần_
- **Response `data`:**
  ```json
  {
    "id": "uuid-user",
    "fullName": "Nguyễn Văn A",
    "email": "nva@coffee.vn",
    "phone": "0987654321",
    "status": "ACTIVE",
    "createdAt": "2026-01-15T08:00:00"
  }
  ```
  > **Lưu ý:** Response **KHÔNG** chứa `passwordHash` hoặc `posPin`.

- **Lỗi có thể nhận:**

  | errorCode       | HTTP | Mô tả                     |
  | --------------- | ---- | ------------------------- |
  | `USER_NOT_FOUND` | 404  | Token expired hoặc lỗi DB |

---

### 11.2 Cập Nhật Profile Cá Nhân

- **Method:** `PUT /api/v1/account/me`
- **Headers:** `Authorization: Bearer <access_token>`
- **Request Body:**
  ```json
  {
    "fullName": "Nguyễn Văn A (Mới)", // Bắt buộc, max 100 ký tự
    "phone": "0912345678"               // Tuỳ chọn, định dạng VN: 0[0-9]{9}
  }
  ```
  > **Lưu ý:** `email` không thể thay đổi qua endpoint này.
- **Response `data`:** Profile sau khi cập nhật (cùng format với 11.1)
- **Lỗi có thể nhận:**

  | errorCode              | HTTP | Mô tả                                    |
  | ---------------------- | ---- | ---------------------------------------- |
  | `PHONE_ALREADY_EXISTS` | 409  | SĐT đã được dùng bởi tài khoản khác trong tenant |
  | `USER_NOT_FOUND`       | 404  | Lỗi hệ thống                              |

---

### 11.3 Đổi Mật Khẩu

- **Method:** `PUT /api/v1/account/me/password`
- **Headers:** `Authorization: Bearer <access_token>`
- **Request Body:**
  ```json
  {
    "currentPassword": "OldPassword1!",  // Bắt buộc — để xác thực danh tính
    "newPassword": "NewPassword2!"       // Bắt buộc — min 8 ký tự, ≥1 chữ hoa, ≥1 chữ số
  }
  ```
- **Response:** `200 OK` với `data: null` (không có data body)
- **Sau khi đổi mật khẩu thành công:** FE nên redirect về trang đăng nhập để user đăng nhập lại với mật khẩu mới.
- **Lỗi có thể nhận:**

  | errorCode        | HTTP | Mô tả                                    |
  | ---------------- | ---- | ---------------------------------------- |
  | `WRONG_PASSWORD` | 400  | Mật khẩu hiện tại không đúng             |
  | `PASSWORD_SAME`  | 400  | Mật khẩu mới trùng với mật khẩu hiện tại |

---

**Ví dụ JavaScript:**

```javascript
// Lấy profile
const profile = await fetch('/api/v1/account/me', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Cập nhật profile
await fetch('/api/v1/account/me', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ fullName: 'Tên Mới', phone: '0912345678' })
});

// Đổi mật khẩu
const res = await fetch('/api/v1/account/me/password', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    currentPassword: 'OldPassword1!',
    newPassword: 'NewPassword2!'
  })
});
if (res.ok) {
  // Redirect về login
  window.location.href = '/login';
}
```

