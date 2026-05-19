# 📋 SmartF&B — API Documentation (Hoàn Chỉnh)

> **Base URL (Local):** `http://localhost:8080`  
> **Base URL (Production):** `https://api.smartfnb.vn` *(cấu hình qua env `BASE_URL`)*  
> **API Version:** `v1`  
> **Content-Type mặc định:** `application/json`  
> **Swagger UI:** `GET /swagger-ui.html`  
> **OpenAPI JSON:** `GET /api-docs`

---

## 🔐 Xác thực & Authorization

Hầu hết API yêu cầu **JWT Bearer Token** trong Header:

```
Authorization: Bearer <accessToken>
```

| Thông tin | Giá trị |
|-----------|---------|
| Token type | Bearer JWT |
| Access token TTL | 1 giờ (3600s) |
| Refresh token TTL | 7 ngày |
| Thuật toán ký | HMAC-SHA256 |
| JWT Claims | `userId`, `tenantId`, `branchId`, `role` |

> **Lưu ý về `branchId` trong JWT:** Sau khi đăng nhập, user cần gọi `POST /api/v1/auth/select-branch` để cấp JWT có `branchId`. Hầu hết API dùng `branchId` này để phân quyền dữ liệu.

---

## 📐 Chuẩn Response

Tất cả API trả về cấu trúc `ApiResponse<T>`:

```json
// ✅ Thành công
{
  "success": true,
  "data": <T>,
  "error": null
}

// ❌ Thất bại  
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mô tả lỗi"
  }
}
```

**Phân trang** (`PageResponse<T>`):
```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 100,
  "totalPages": 5
}
```

---

## 🔑 1. AUTH MODULE — Xác thực

**Base path:** `/api/v1/auth`  
**Không cần JWT** (trừ `/select-branch`)

---

### 1.1 Đăng ký Tenant mới

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/register` |
| **Mô tả** | Chủ quán tạo tài khoản SaaS mới. Tạo Tenant + User OWNER + Subscription. Trả JWT ngay. |
| **Auth** | ❌ Không cần |
| **Quyền** | Public |

**Request Body:**
```json
{
  "tenantName": "Cà phê Phúc Long",
  "email": "owner@phuclong.vn",
  "password": "Abc@12345",
  "ownerName": "Nguyễn Văn A",
  "phone": "0901234567",
  "planSlug": "basic"
}
```

| Field | Type | Bắt buộc | Ràng buộc |
|-------|------|----------|-----------|
| `tenantName` | string | ✅ | max 255 ký tự |
| `email` | string | ✅ | format email, unique toàn hệ thống |
| `password` | string | ✅ | min 8 ký tự |
| `ownerName` | string | ✅ | max 255 ký tự |
| `phone` | string | ❌ | tùy chọn |
| `planSlug` | string | ✅ | phải là slug gói hợp lệ (vd: "basic", "standard", "premium") |

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "userId": "uuid",
    "tenantId": "uuid",
    "role": "OWNER",
    "branchId": null,
    "branchName": null,
    "fullName": "Nguyễn Văn A"
  }
}
```

---

### 1.2 Đăng nhập (Email + Password)

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/login` |
| **Mô tả** | Đăng nhập bằng email và mật khẩu. Sai 5 lần liên tiếp → khóa tài khoản 30 phút. |
| **Auth** | ❌ Không cần |
| **Quyền** | Public |

**Request Body:**
```json
{
  "email": "owner@phuclong.vn",
  "password": "Abc@12345"
}
```

| Field | Type | Bắt buộc | Ràng buộc |
|-------|------|----------|-----------|
| `email` | string | ✅ | không được trống |
| `password` | string | ✅ | không được trống |

**Response `200 OK`:** *(giống 1.1)*

**Lỗi phổ biến:**
- `401` — Email hoặc mật khẩu sai
- `423` — Tài khoản bị khóa (sai quá 5 lần)

---

### 1.3 Làm mới Access Token

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/refresh` |
| **Mô tả** | Dùng refresh token (còn hạn) để lấy access token mới. |
| **Auth** | ❌ Không cần |

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1..."
}
```

**Response `200 OK`:** *(giống 1.1)*

---

### 1.4 Chọn chi nhánh làm việc

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/select-branch` |
| **Mô tả** | Cấp lại JWT mới nhúng `branchId` để thao tác với dữ liệu chi nhánh cụ thể. |
| **Auth** | ✅ Bearer Token |
| **Quyền** | Authenticated |

**Request Body:**
```json
{
  "branchId": "uuid-chi-nhanh"
}
```

**Response `200 OK`:** *(giống 1.1, JWT mới có `branchId`)*

---

### 1.5 Quên mật khẩu — Bước 1: Gửi OTP

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/forgot-password` |
| **Mô tả** | Gửi mã OTP 6 số qua email. **Luôn trả 200 OK** dù email có tồn tại hay không (bảo mật user-enumeration). OTP hết hạn sau **10 phút**. |
| **Auth** | ❌ Không cần |

**Request Body:**
```json
{ "email": "owner@phuclong.vn" }
```

**Response `200 OK`:** `{ "success": true, "data": null }`

---

### 1.6 Quên mật khẩu — Bước 2: Xác thực OTP

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/verify-otp` |
| **Mô tả** | Nhập OTP nhận được → nhận `resetToken` tạm thời (có hiệu lực **15 phút**). |
| **Auth** | ❌ Không cần |

**Request Body:**
```json
{
  "email": "owner@phuclong.vn",
  "otp": "123456"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": { "resetToken": "uuid-or-signed-token" }
}
```

---

### 1.7 Quên mật khẩu — Bước 3: Đặt mật khẩu mới

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/reset-password` |
| **Mô tả** | Đặt mật khẩu mới sau khi OTP xác thực thành công. Mật khẩu mới không được trùng mật khẩu cũ. |
| **Auth** | ❌ Không cần |

**Request Body:**
```json
{
  "email": "owner@phuclong.vn",
  "resetToken": "uuid-or-signed-token",
  "newPassword": "NewPass@2026"
}
```

| Field | Ràng buộc |
|-------|-----------|
| `newPassword` | min 8 ký tự, không được trùng mật khẩu cũ |

**Response `200 OK`:** `{ "success": true, "data": null }`

---

### 1.8 Đăng nhập POS bằng PIN

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/auth/pin-login` |
| **Mô tả** | Đăng nhập nhanh tại màn hình POS bằng PIN 4-6 số. Dành cho Cashier/Barista/Waiter. Không cần nhập email/mật khẩu. |
| **Auth** | ❌ Không cần |

**Request Body:**
```json
{
  "tenantId": "uuid-tenant",
  "userId": "uuid-staff",
  "pin": "1234"
}
```

| Field | Ràng buộc |
|-------|-----------|
| `pin` | 4-6 chữ số |

**Response `200 OK`:** *(JWT với role nhân viên)*

---

## 🏢 2. BRANCH MODULE — Quản lý chi nhánh

**Base path:** `/api/v1/branches`  
**Header yêu cầu:** `Authorization: Bearer <token>`

---

### 2.1 Danh sách chi nhánh

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/branches` |
| **Mô tả** | Lấy tất cả chi nhánh của Tenant (tenantId từ JWT). |
| **Quyền** | `BRANCH_VIEW` hoặc `BRANCH_EDIT` |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "name": "Chi nhánh Q1",
      "address": "123 Lê Lợi, Q1",
      "phone": "028...",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2.2 Tạo chi nhánh mới

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/branches` |
| **Mô tả** | Tạo chi nhánh mới. Logic validate quota gói cước (gói Basic giới hạn số chi nhánh) được xử lý phía Service. |
| **Quyền** | `BRANCH_EDIT` |

**Request Body:**
```json
{
  "name": "Chi nhánh Quận 3",
  "address": "456 Võ Văn Tần, Q3",
  "phone": "028-3333-4444"
}
```

**Response `201 Created`:** *(BranchResponse)*

---

### 2.3 Cập nhật chi nhánh

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `PUT` |
| **Endpoint** | `/api/v1/branches/{branchId}` |
| **Quyền** | `BRANCH_EDIT` |

**Path Param:** `branchId` — UUID chi nhánh  
**Request Body:** *(giống 2.2)*  
**Response `200 OK`:** *(BranchResponse)*

---

### 2.4 Gán nhân viên vào chi nhánh

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/branches/{branchId}/users` |
| **Mô tả** | Gán user vào làm việc tại chi nhánh. |
| **Quyền** | `BRANCH_EDIT` |

**Request Body:**
```json
{ "userId": "uuid-nhan-vien" }
```

**Response `200 OK`:** `{ "success": true, "data": null }`

---

## 🍽️ 3. MENU MODULE — Thực đơn

### 3.1 CATEGORY — Danh mục

**Base path:** `/api/v1/menu/categories`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 3.1.1 | `GET` | `/api/v1/menu/categories` | Danh sách danh mục (có tìm kiếm + phân trang) | `MENU_VIEW` |
| 3.1.2 | `GET` | `/api/v1/menu/categories/active` | Danh mục đang active (dùng cho POS dropdown) | `MENU_VIEW` |
| 3.1.3 | `GET` | `/api/v1/menu/categories/{id}` | Chi tiết một danh mục | `MENU_VIEW` |
| 3.1.4 | `POST` | `/api/v1/menu/categories` | Tạo danh mục mới | `MENU_EDIT` |
| 3.1.5 | `PUT` | `/api/v1/menu/categories/{id}` | Cập nhật danh mục | `MENU_EDIT` |
| 3.1.6 | `DELETE` | `/api/v1/menu/categories/{id}` | Soft delete danh mục | `MENU_EDIT` |

**GET `/api/v1/menu/categories` — Query Params:**

| Param | Type | Mặc định | Mô tả |
|-------|------|----------|-------|
| `keyword` | string | null | Từ khóa tìm kiếm |
| `page` | int | 0 | Số trang |
| `size` | int | 20 | Số bản ghi/trang |

**POST/PUT `/api/v1/menu/categories` — Request Body:**
```json
{
  "name": "Cà phê",
  "description": "Các loại cà phê",
  "isActive": true,
  "displayOrder": 1
}
```

> **Lưu ý:** Khi `isActive = false` khi PUT → **cascade deactivate** toàn bộ món ăn trong danh mục đó.

**Response Category:**
```json
{
  "id": "uuid",
  "name": "Cà phê",
  "description": "...",
  "isActive": true,
  "displayOrder": 1
}
```

---

### 3.2 MENU ITEM — Món ăn / Nguyên liệu / Bán thành phẩm

**Base path:** `/api/v1/menu/items`  
⚠️ **POST và PUT dùng `multipart/form-data`** (upload ảnh)

---

#### 🏷️ Giải thích trường `type` — 3 loại Item trong hệ thống

Tất cả nguyên liệu, món bán, bán thành phẩm đều dùng chung bảng `items`, phân biệt nhau qua trường `type`. **`type` không thể thay đổi sau khi tạo.**

---

##### 🟢 `SELLABLE` — Món bán trực tiếp cho khách

> **Khái niệm:** Item mà nhân viên POS chọn vào đơn hàng, khách hàng nhìn thấy trên menu và trả tiền.

| Đặc điểm | Mô tả |
|----------|-------|
| **Hiển thị POS** | ✅ Có — xuất hiện trong dropdown chọn món khi tạo đơn |
| **Có giá bán** | ✅ Có `basePrice` > 0 |
| **Có ảnh** | ✅ Có thể upload ảnh hiển thị trên menu |
| **Có công thức** | ✅ Có thể gắn công thức (Recipe) chứa các `INGREDIENT` |
| **Trừ kho tự động** | ✅ Khi đơn hàng hoàn thành → hệ thống tự trừ nguyên liệu theo công thức (FIFO) |
| **Đồng bộ giao hàng** | ✅ Nếu `isSyncDelivery=true` → đồng bộ lên app giao đồ ăn bên thứ 3 |
| **Tìm kiếm fuzzy** | ✅ Hỗ trợ tìm theo `keyword` (pg_trgm) |

**Ví dụ thực tế:**
- `Cà phê đen` (25.000đ/ly)
- `Trà sữa trân châu` (45.000đ/ly)
- `Bánh mì thịt` (30.000đ/cái)
- `Combo sáng` (50.000đ/phần)

**Luồng nghiệp vụ:**
```
Khách gọi món → POS chọn SELLABLE vào đơn
→ Đơn hoàn thành (COMPLETED)
→ BE tự động trừ INGREDIENT theo Recipe của món đó
```

---

##### 🔵 `INGREDIENT` — Nguyên liệu thô dùng để pha chế

> **Khái niệm:** Nguyên liệu được quản lý trong kho, không bán trực tiếp cho khách. Được tiêu thụ khi pha chế món `SELLABLE` hoặc sản xuất `SUB_ASSEMBLY`.

| Đặc điểm | Mô tả |
|----------|-------|
| **Hiển thị POS** | ❌ Không — nhân viên không thể chọn vào đơn hàng |
| **Có giá bán** | ❌ Không có giá bán (hoặc để 0) — chỉ có `costPerUnit` khi nhập kho |
| **Có ảnh** | ❌ Không cần |
| **Có công thức** | ❌ Không — INGREDIENT là đầu vào của công thức |
| **Quản lý kho** | ✅ Có — theo dõi tồn kho, nhập kho, hao hụt |
| **Cảnh báo tồn thấp** | ✅ Có `minLevel` — cảnh báo `isLowStock=true` khi dưới ngưỡng |
| **Tìm kiếm fuzzy** | ❌ Không hỗ trợ keyword search (chỉ SELLABLE mới có) |

**Ví dụ thực tế (cho quán cà phê):**
- `Cà phê robusta` (đơn vị: kg)
- `Sữa tươi` (đơn vị: lít)
- `Đường cát` (đơn vị: kg)
- `Trà oolong` (đơn vị: g)
- `Trân châu đen` (đơn vị: kg)
- `Ly nhựa 700ml` (đơn vị: cái)

**Luồng nghiệp vụ:**
```
Nhập kho: POST /api/v1/inventory/import (itemId = ID của INGREDIENT)
→ Tồn kho tăng

Khi SELLABLE bán xong:
→ BE tự trừ INGREDIENT theo Recipe (FIFO)
→ Tồn kho giảm

Hao hụt: POST /api/v1/inventory/waste (itemId = ID của INGREDIENT)
→ Tồn kho giảm + ghi audit log
```

**FE dùng INGREDIENT khi nào:**
- Màn hình **Quản lý kho** → hiển thị danh sách, tồn kho
- Màn hình **Nhập kho** → chọn INGREDIENT để nhập
- Màn hình **Thiết lập công thức** → chọn INGREDIENT làm nguyên liệu
- Màn hình **Đơn mua hàng** → chọn INGREDIENT để đặt mua

---

##### 🟡 `SUB_ASSEMBLY` — Bán thành phẩm (chế biến trước, dùng nhiều lần)

> **Khái niệm:** Item được SẢN XUẤT sẵn từ nhiều `INGREDIENT` (theo công thức), lưu kho dưới dạng thành phẩm. Sau đó được dùng làm nguyên liệu cho các món `SELLABLE` khác. Phù hợp với mô hình **sản xuất lô** (batch production) — ví dụ pha sẵn lô trà, nấu sẵn nước lèo...

| Đặc điểm | Mô tả |
|----------|-------|
| **Hiển thị POS** | ❌ Không — không bán trực tiếp cho khách |
| **Có giá bán** | ❌ Không — chỉ có giá thành sản xuất |
| **Có công thức** | ✅ Có — khai báo INGREDIENT đầu vào để sản xuất |
| **Quản lý kho** | ✅ Có — tồn kho tăng sau mỗi mẻ sản xuất |
| **Mẻ sản xuất** | ✅ Dùng API `POST /api/v1/inventory/production-batches` |
| **Dùng trong công thức SELLABLE** | ✅ SUB_ASSEMBLY có thể là nguyên liệu đầu vào của SELLABLE |

**Ví dụ thực tế:**
- `Trà base oolong` (pha sẵn lô 5 lít từ trà khô + nước)
- `Nước lèo bò` (nấu lô 20 lít từ xương + gia vị)
- `Syrup caramel` (nấu sẵn từ đường + nước)
- `Kem cheese` (đánh sẵn từ phô mai + sữa + muối)
- `Thịt xá xíu` (ướp + nướng sẵn theo mẻ)

**Luồng nghiệp vụ:**
```
1. Tạo SUB_ASSEMBLY item: "Trà base oolong"
2. Tạo công thức (Recipe): 1 lít trà base = 50g trà khô + 1 lít nước
3. Sản xuất mẻ: POST /api/v1/inventory/production-batches
   → BE tự trừ 50g trà khô + 1 lít nước khỏi kho (FIFO)
   → BE tăng tồn kho "Trà base oolong" theo actualOutputQuantity
4. Thiết lập công thức SELLABLE "Trà sữa" dùng "Trà base oolong" làm nguyên liệu
5. Khi bán trà sữa → BE tự trừ lượng trà base
```

---

#### 📊 Bảng so sánh nhanh 3 loại

| Tiêu chí | SELLABLE | INGREDIENT | SUB_ASSEMBLY |
|----------|----------|------------|---------------|
| Bán cho khách (POS) | ✅ | ❌ | ❌ |
| Có giá bán | ✅ | ❌ | ❌ |
| Có ảnh menu | ✅ | ❌ | ❌ |
| Quản lý tồn kho | ✅ (gián tiếp) | ✅ (trực tiếp) | ✅ (sau sản xuất) |
| Nhập kho thủ công | ❌ | ✅ | ❌ (chỉ qua sản xuất) |
| Có công thức (Recipe) | ✅ (gắn ingredient) | ❌ | ✅ (gắn ingredient) |
| Là đầu vào của Recipe | ❌ | ✅ | ✅ |
| Sản xuất theo lô (Batch) | ❌ | ❌ | ✅ |
| Tìm fuzzy keyword | ✅ | ❌ | ❌ |
| Đồng bộ app giao hàng | ✅ | ❌ | ❌ |

---

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 3.2.1 | `GET` | `/api/v1/menu/items` | Danh sách items (có filter type + tìm kiếm fuzzy pg_trgm) | `MENU_VIEW` |
| 3.2.2 | `GET` | `/api/v1/menu/items/active` | Danh sách món active (cho POS picker) | `MENU_VIEW` |
| 3.2.3 | `GET` | `/api/v1/menu/items/{id}` | Chi tiết item | `MENU_VIEW` |
| 3.2.4 | `GET` | `/api/v1/menu/items/{id}/recipe` | Công thức chế biến của món | `MENU_VIEW` |
| 3.2.5 | `POST` | `/api/v1/menu/items` | Tạo item mới (upload ảnh) | `MENU_EDIT` |
| 3.2.6 | `PUT` | `/api/v1/menu/items/{id}` | Cập nhật item (thay ảnh nếu gửi) | `MENU_EDIT` |
| 3.2.7 | `DELETE` | `/api/v1/menu/items/{id}` | Soft delete item | `MENU_EDIT` |

**GET `/api/v1/menu/items` — Query Params:**

| Param | Type | Mặc định | Mô tả |
|-------|------|----------|-------|
| `keyword` | string | null | Tìm kiếm fuzzy — **chỉ hoạt động với `SELLABLE`** |
| `type` | string | null | `SELLABLE` / `INGREDIENT` / `SUB_ASSEMBLY` — bỏ trống để lấy tất cả |
| `page` | int | 0 | - |
| `size` | int | 20 | - |

> **Gợi ý FE:** 
> - Màn hình **Menu/Quản lý món**: gọi với `?type=SELLABLE`
> - Màn hình **Quản lý kho/Nhập kho**: gọi với `?type=INGREDIENT`
> - Màn hình **Sản xuất bán thành phẩm**: gọi với `?type=SUB_ASSEMBLY`
> - Dropdown **thiết lập công thức Recipe** (chọn nguyên liệu): gọi với `?type=INGREDIENT` hoặc `?type=SUB_ASSEMBLY`

**POST `/api/v1/menu/items` — multipart/form-data:**

| Part | Content-Type | Bắt buộc | Mô tả |
|------|-------------|----------|-------|
| `data` | `application/json` | ✅ | JSON thông tin item |
| `image` | `image/jpeg`, `image/png`, `image/webp` | ❌ | File ảnh, tối đa 5MB — **chỉ cần với SELLABLE** |

```json
// Ví dụ 1 — Tạo món bán (SELLABLE):
{
  "categoryId": "uuid-danh-muc-ca-phe",
  "name": "Cà phê đen",
  "type": "SELLABLE",
  "basePrice": 25000,
  "unit": "ly",
  "isSyncDelivery": false
}

// Ví dụ 2 — Tạo nguyên liệu (INGREDIENT):
{
  "categoryId": null,
  "name": "Cà phê robusta",
  "type": "INGREDIENT",
  "basePrice": 0,
  "unit": "kg",
  "isSyncDelivery": false
}

// Ví dụ 3 — Tạo bán thành phẩm (SUB_ASSEMBLY):
{
  "categoryId": null,
  "name": "Trà base oolong",
  "type": "SUB_ASSEMBLY",
  "basePrice": 0,
  "unit": "lít",
  "isSyncDelivery": false
}
```

| Field | Ràng buộc |
|-------|-----------|
| `name` | NotBlank, max 255 ký tự, **unique trong tenant** |
| `type` | `SELLABLE` *(mặc định nếu không truyền)* / `INGREDIENT` / `SUB_ASSEMBLY` — **bất biến sau khi tạo** |
| `basePrice` | NotNull, ≥ 0 *(INGREDIENT và SUB_ASSEMBLY thường để 0)* |
| `unit` | max 30 ký tự *(vd: ly, kg, g, ml, lít, cái, phần)* |
| `isSyncDelivery` | Chỉ có ý nghĩa với `SELLABLE` |

**Response MenuItem:**
```json
{
  "id": "uuid",
  "name": "Cà phê đen",
  "type": "SELLABLE",
  "basePrice": 25000,
  "unit": "ly",
  "imageUrl": "http://localhost:8080/uploads/abc.jpg",
  "categoryId": "uuid",
  "categoryName": "Cà phê",
  "isActive": true
}
```

---

### 3.3 ADDON — Topping/Addon

**Base path:** `/api/v1/menu/addons`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 3.3.1 | `GET` | `/api/v1/menu/addons` | Danh sách addon (phân trang) | `MENU_VIEW` |
| 3.3.2 | `GET` | `/api/v1/menu/addons/active` | Addon đang active (cho POS chọn topping) | `MENU_VIEW` |
| 3.3.3 | `GET` | `/api/v1/menu/addons/{id}` | Chi tiết addon | `MENU_VIEW` |
| 3.3.4 | `POST` | `/api/v1/menu/addons` | Tạo addon mới | `MENU_EDIT` |
| 3.3.5 | `PUT` | `/api/v1/menu/addons/{id}` | Cập nhật addon | `MENU_EDIT` |
| 3.3.6 | `DELETE` | `/api/v1/menu/addons/{id}` | Soft delete addon | `MENU_EDIT` |

**Request Body (POST/PUT):**
```json
{
  "name": "Thêm đường",
  "price": 5000,
  "isActive": true
}
```

---

### 3.4 RECIPE — Công thức chế biến

**Base path:** `/api/v1/menu/recipes`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 3.4.1 | `POST` | `/api/v1/menu/recipes` | Thêm nguyên liệu vào công thức | `MENU_EDIT` |
| 3.4.2 | `PUT` | `/api/v1/menu/recipes/{id}` | Cập nhật định lượng nguyên liệu | `MENU_EDIT` |
| 3.4.3 | `DELETE` | `/api/v1/menu/recipes/{id}` | Xóa dòng nguyên liệu khỏi công thức | `MENU_EDIT` |

**POST Request Body:**
```json
{
  "menuItemId": "uuid-mon-an",
  "ingredientItemId": "uuid-nguyen-lieu",
  "quantity": 30,
  "unit": "ml",
  "baseOutputQuantity": 1,
  "baseOutputUnit": "ly"
}
```

---

### 3.5 BRANCH ITEM — Giá theo chi nhánh

**Base path:** `/api/v1/menu/branches/{branchId}/items`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 3.5.1 | `GET` | `/api/v1/menu/branches/{branchId}/items/{itemId}` | Lấy giá item tại chi nhánh | `MENU_VIEW` |
| 3.5.2 | `PUT` | `/api/v1/menu/branches/{branchId}/items/{itemId}/price` | Đặt giá riêng + trạng thái phục vụ tại chi nhánh | `MENU_EDIT` |

**PUT Request Body (3.5.2):**
```json
{
  "branchPrice": 28000,
  "isAvailable": true
}
```

> `branchPrice = null` → xóa giá riêng, quay về dùng `basePrice`.

**Response (3.5.1):**
```json
{
  "itemId": "uuid",
  "itemName": "Cà phê đen",
  "basePrice": 25000,
  "branchPrice": 28000,
  "effectivePrice": 28000,
  "isAvailable": true
}
```

---

## 📦 4. ORDER MODULE — Đặt hàng & Bàn

### 4.1 TABLE ZONE — Khu vực bàn

**Base path:** `/api/v1/branches/{branchId}/zones`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 4.1.1 | `GET` | `/api/v1/branches/{branchId}/zones` | Danh sách zone (sắp xếp theo tầng + tên) | `ORDER_VIEW` |
| 4.1.2 | `GET` | `/api/v1/branches/{branchId}/zones/{zoneId}` | Chi tiết zone | `ORDER_VIEW` |
| 4.1.3 | `POST` | `/api/v1/branches/{branchId}/zones` | Tạo zone mới | `BRANCH_EDIT` |
| 4.1.4 | `PUT` | `/api/v1/branches/{branchId}/zones/{zoneId}` | Cập nhật zone | `BRANCH_EDIT` |
| 4.1.5 | `DELETE` | `/api/v1/branches/{branchId}/zones/{zoneId}` | Xóa zone (chỉ được khi không còn bàn) | `BRANCH_EDIT` |

**POST/PUT Request Body:**
```json
{
  "name": "Tầng 1",
  "floor": 1,
  "description": "Khu vực trong nhà"
}
```

---

### 4.2 TABLE — Bàn

**Base path:** `/api/v1/branches/{branchId}/tables`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 4.2.1 | `GET` | `/api/v1/branches/{branchId}/tables` | Sơ đồ bàn (toàn bộ bàn chưa xóa) | `TABLE_VIEW` |
| 4.2.2 | `GET` | `/api/v1/branches/{branchId}/tables/{tableId}` | Chi tiết bàn | `TABLE_VIEW` |
| 4.2.3 | `GET` | `/api/v1/branches/{branchId}/tables/stats/occupied-count` | Số bàn đang có khách (OCCUPIED) | `TABLE_VIEW` |
| 4.2.4 | `POST` | `/api/v1/branches/{branchId}/tables` | Tạo bàn mới | `TABLE_EDIT` |
| 4.2.5 | `PUT` | `/api/v1/branches/{branchId}/tables/{tableId}` | Cập nhật thông tin bàn | `TABLE_EDIT` |
| 4.2.6 | `DELETE` | `/api/v1/branches/{branchId}/tables/{tableId}` | Soft delete bàn | `TABLE_EDIT` |
| 4.2.7 | `PUT` | `/api/v1/branches/{branchId}/tables/positions` | Batch update vị trí bàn (Drag & Drop) — broadcast WebSocket | `TABLE_EDIT` |

**POST Request Body (4.2.4):**
```json
{
  "name": "Bàn A1",
  "capacity": 4,
  "zoneId": "uuid-zone",
  "positionX": 100,
  "positionY": 200
}
```

**PUT `/positions` Request Body (4.2.7):**
```json
{
  "positions": [
    { "tableId": "uuid-1", "positionX": 100, "positionY": 200 },
    { "tableId": "uuid-2", "positionX": 300, "positionY": 200 }
  ]
}
```

> Sau khi lưu, hệ thống tự **broadcast WebSocket** tới topic `/topic/tables/{branchId}` để tất cả client cùng branch cập nhật realtime.

> **Ràng buộc:** Không xóa được bàn đang `OCCUPIED` (có khách).

**Response Table:**
```json
{
  "id": "uuid",
  "name": "Bàn A1",
  "capacity": 4,
  "status": "AVAILABLE",
  "zoneId": "uuid",
  "zoneName": "Tầng 1",
  "positionX": 100,
  "positionY": 200
}
```

---

### 4.3 ORDER — Đơn hàng

**Base path:** `/api/v1/orders`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 4.3.1 | `GET` | `/api/v1/orders` | Danh sách đơn hàng (filter + phân trang) | `ORDER_VIEW` |
| 4.3.2 | `GET` | `/api/v1/orders/{id}` | Chi tiết đơn hàng | `ORDER_VIEW` |
| 4.3.3 | `POST` | `/api/v1/orders` | Tạo đơn hàng mới | `ORDER_CREATE` |
| 4.3.4 | `PUT` | `/api/v1/orders/{id}` | Cập nhật đơn hàng (chưa hoàn tất/hủy) | `ORDER_UPDATE` |
| 4.3.5 | `PUT` | `/api/v1/orders/{id}/status` | Cập nhật trạng thái đơn | `ORDER_UPDATE` |
| 4.3.6 | `POST` | `/api/v1/orders/{id}/cancel` | Hủy đơn hàng | `ORDER_CANCEL` |

**GET `/api/v1/orders` — Query Params:**

| Param | Type | Mô tả |
|-------|------|-------|
| `status` | string | `PENDING` / `CONFIRMED` / `SERVING` / `COMPLETED` / `CANCELLED` |
| `from` | Instant | Lọc từ thời điểm (ISO-8601) |
| `to` | Instant | Lọc đến thời điểm (ISO-8601) |
| `tableId` | UUID | Lọc theo bàn |
| `page` | int | mặc định 0 |
| `size` | int | mặc định 20 |

**POST `/api/v1/orders` — Request Body:**
```json
{
  "tableId": "uuid-ban",
  "source": "POS",
  "notes": "Khách dị ứng đậu phộng",
  "items": [
    {
      "itemId": "uuid-item",
      "itemName": "Cà phê đen",
      "quantity": 2,
      "unitPrice": 25000,
      "addons": "Thêm đường, ít đá",
      "notes": null
    }
  ]
}
```

| Field | Ràng buộc |
|-------|-----------|
| `items` | NotEmpty, cần ít nhất 1 món |
| `source` | `POS` / `QR_SELF_ORDER` / `DELIVERY` |

**PUT `/api/v1/orders/{id}/status` — Request Body:**
```json
{
  "newStatus": "CONFIRMED",
  "reason": null
}
```

**POST `/api/v1/orders/{id}/cancel` — Request Body:**
```json
{ "reason": "Khách đổi ý" }
```

**Response OrderResponse:**
```json
{
  "id": "uuid",
  "orderNumber": "ORD-20260416-001",
  "tableId": "uuid",
  "tableName": "Bàn A1",
  "userId": "uuid",
  "staffName": "Nguyễn Thị B",
  "source": "POS",
  "status": "PENDING",
  "subtotal": 50000,
  "discountAmount": 0,
  "taxAmount": 0,
  "totalAmount": 50000,
  "notes": "...",
  "createdAt": "2026-04-16T08:30:00Z",
  "completedAt": null,
  "items": [
    {
      "id": "uuid",
      "itemId": "uuid",
      "itemName": "Cà phê đen",
      "quantity": 2,
      "unitPrice": 25000,
      "totalPrice": 50000,
      "addons": "Thêm đường",
      "notes": null,
      "status": "PENDING"
    }
  ]
}
```

---

## 💳 5. PAYMENT MODULE — Thanh toán

**Base path:** `/api/v1/payments`

---

### 5.1 Thanh toán tiền mặt

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/payments/cash` |
| **Mô tả** | Thu ngân nhập số tiền nhận được → tạo Payment + hóa đơn (Invoice). |
| **Quyền** | `PAYMENT_CREATE` hoặc role `CASHIER`/`BRANCH_MANAGER`/`OWNER`/`SUPER_ADMIN` |

**Request Body:**
```json
{
  "orderId": "uuid-don-hang",
  "amount": 50000
}
```

| Field | Ràng buộc |
|-------|-----------|
| `orderId` | NotNull |
| `amount` | NotNull, tối đa 12 chữ số, 2 chữ số thập phân |

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderId": "uuid",
    "amount": 50000,
    "method": "CASH",
    "status": "COMPLETED",
    "transactionId": null,
    "paidAt": "2026-04-16T08:30:00Z",
    "createdAt": "2026-04-16T08:30:00Z"
  }
}
```

---

### 5.2 Tạo QR Code thanh toán

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/payments/qr` |
| **Mô tả** | Tạo QR code thanh toán. QR có hiệu lực **3 phút**. |
| **Quyền** | `PAYMENT_CREATE` hoặc role Cashier trở lên |

**Request Body:**
```json
{
  "orderId": "uuid-don-hang",
  "amount": 50000,
  "qrMethod": "VIETQR"
}
```

| Field | Ràng buộc |
|-------|-----------|
| `qrMethod` | `VIETQR` hoặc `MOMO` |

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "qrCodeUrl": "https://...",
    "qrCodeData": "00020101...",
    "expiresInSeconds": 180,
    "orderNumber": "ORD-20260416-001"
  }
}
```

---

### 5.3 Webhook xác nhận QR Payment

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/payments/qr/webhook` |
| **Mô tả** | **Payment gateway gọi BE** khi thanh toán QR được xác nhận. Không dùng bởi FE trực tiếp. |
| **Auth** | ❌ Không cần (internal webhook) |

**Request Body:**
```json
{
  "paymentId": "uuid",
  "transactionId": "GW-TXN-12345",
  "status": "SUCCESS",
  "amount": 50000,
  "paidAtTimestamp": 1713250000000
}
```

---

### 5.4 Tìm kiếm hóa đơn

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/payments/invoices` |
| **Mô tả** | Tìm kiếm hóa đơn. Giới hạn **90 ngày gần nhất**. |
| **Quyền** | `PAYMENT_VIEW` hoặc role Cashier trở lên |

**Query Params:**

| Param | Type | Mô tả |
|-------|------|-------|
| `invoiceNumber` | string | Tìm theo số hóa đơn (tùy chọn) |
| `page` | int | mặc định 0 |
| `size` | int | mặc định 20 |

---

### 5.5 Chi tiết hóa đơn theo ID

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/payments/invoices/{invoiceId}` |
| **Quyền** | `PAYMENT_VIEW` hoặc role Cashier trở lên |

**Response:**
```json
{
  "id": "uuid",
  "orderId": "uuid",
  "paymentId": "uuid",
  "invoiceNumber": "INV-20260416-001",
  "subtotal": 50000,
  "discount": 0,
  "taxAmount": 0,
  "total": 50000,
  "issuedAt": "2026-04-16T08:30:00Z",
  "items": [
    {
      "itemName": "Cà phê đen",
      "quantity": 2,
      "unitPrice": 25000,
      "totalPrice": 50000
    }
  ]
}
```

---

### 5.6 Chi tiết hóa đơn theo Invoice Number

| Method | Endpoint | Quyền |
|--------|----------|-------|
| `GET` | `/api/v1/payments/invoices/number/{invoiceNumber}` | `PAYMENT_VIEW` |

---

### 5.7 Chi tiết Payment theo ID

| Method | Endpoint | Quyền |
|--------|----------|-------|
| `GET` | `/api/v1/payments/{paymentId}` | `PAYMENT_VIEW` |

---

## 🗄️ 6. INVENTORY MODULE — Quản lý kho

**Base path:** `/api/v1/inventory`  
**branchId lấy từ JWT** (không nhận từ request body)

---

### 6.1 Nhập kho nguyên liệu

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/inventory/import` |
| **Mô tả** | Tạo lô hàng nhập kho mới (StockBatch) và cập nhật tồn kho. |
| **Quyền** | `INVENTORY_IMPORT` |

**Request Body:**
```json
{
  "itemId": "uuid-nguyen-lieu",
  "supplierId": "uuid-nha-cung-cap",
  "quantity": 10.5,
  "costPerUnit": 15000,
  "expiresAt": "2026-12-31T00:00:00Z",
  "note": "Nhập từ kho An Phú"
}
```

| Field | Ràng buộc |
|-------|-----------|
| `itemId` | NotNull |
| `supplierId` | Có thể null |
| `quantity` | NotNull, > 0 (min 0.0001) |
| `costPerUnit` | NotNull, ≥ 0 |
| `expiresAt` | Có thể null (ISO-8601 Instant) |

**Response `201 Created`:** UUID của StockBatch vừa tạo

---

### 6.2 Điều chỉnh kho thủ công

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/inventory/adjust` |
| **Mô tả** | Đặt lại số lượng tồn kho theo giá trị tuyệt đối mới. Tự động ghi audit_log. |
| **Quyền** | `INVENTORY_ADJUST` |

**Request Body:**
```json
{
  "itemId": "uuid-nguyen-lieu",
  "newQuantity": 8.0,
  "reason": "Kiểm kê thực tế sai lệch"
}
```

| Field | Ràng buộc |
|-------|-----------|
| `newQuantity` | ≥ 0 |
| `reason` | NotBlank (bắt buộc — yêu cầu audit) |

**Response `200 OK`:** `{ "success": true, "data": null }`

---

### 6.3 Ghi nhận hao hụt

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/inventory/waste` |
| **Mô tả** | Ghi nhận nguyên liệu bị hao hụt (hỏng, rò rỉ, hết hạn...). Giảm tồn kho và ghi audit_log. |
| **Quyền** | `INVENTORY_WASTE` |

**Request Body:**
```json
{
  "itemId": "uuid-nguyen-lieu",
  "quantity": 2.5,
  "reason": "Sữa hết hạn sử dụng"
}
```

| Field | Ràng buộc |
|-------|-----------|
| `quantity` | > 0 (min 0.0001) |
| `reason` | NotBlank |

---

### 6.4 Xem tồn kho theo chi nhánh

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/inventory` |
| **Mô tả** | Lấy danh sách tồn kho. **OWNER xem toàn tenant** (branchId=null), các role khác chỉ xem chi nhánh hiện tại. Trả về `isLowStock=true` nếu tồn kho dưới ngưỡng. |
| **Quyền** | `INVENTORY_VIEW` |

**Query Params:**

| Param | Mặc định | Tối đa |
|-------|----------|--------|
| `page` | 0 | - |
| `size` | 20 | 100 |

**Response:**
```json
{
  "content": [
    {
      "itemId": "uuid",
      "itemName": "Cà phê robusta",
      "unit": "kg",
      "quantityOnHand": 8.5,
      "minLevel": 5.0,
      "isLowStock": false,
      "branchId": "uuid",
      "branchName": "Chi nhánh Q1"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 50,
  "totalPages": 3
}
```

---

### 6.5 Lịch sử giao dịch kho

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `GET` |
| **Endpoint** | `/api/v1/inventory/transactions` |
| **Mô tả** | Lịch sử biến động kho có filter. Enrich sẵn tên nguyên liệu và tên nhân viên. |
| **Quyền** | `INVENTORY_VIEW` |

**Query Params:**

| Param | Type | Mô tả |
|-------|------|-------|
| `type` | string | `IMPORT` / `SALE_DEDUCT` / `WASTE` / `ADJUSTMENT` / `PRODUCTION_IN` / `PRODUCTION_OUT` |
| `from` | Instant | Lọc từ thời điểm |
| `to` | Instant | Lọc đến thời điểm |
| `page` | int | mặc định 0 |
| `size` | int | mặc định 20 |

---

### 6.6 Ghi nhận mẻ sản xuất bán thành phẩm

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **Endpoint** | `/api/v1/inventory/production-batches` |
| **Mô tả** | Trừ nguyên liệu đầu vào (FIFO), tăng tồn kho bán thành phẩm theo sản lượng thực tế. |
| **Quyền** | `INVENTORY_IMPORT` |

**Request Body:**
```json
{
  "subAssemblyItemId": "uuid-ban-thanh-pham",
  "expectedOutputQuantity": 20,
  "actualOutputQuantity": 19,
  "unit": "ly",
  "note": "Mẻ trà sữa sáng"
}
```

| Field | Ràng buộc |
|-------|-----------|
| `actualOutputQuantity` | Bắt buộc nhập — sản lượng thực tế |

**Response `201 Created`:** UUID mẻ sản xuất vừa tạo

---

### 6.7 Danh sách mẻ sản xuất

| Method | Endpoint | Quyền |
|--------|----------|-------|
| `GET` | `/api/v1/inventory/production-batches` | `INVENTORY_VIEW` |
| `GET` | `/api/v1/inventory/production-batches/{id}` | `INVENTORY_VIEW` |

---

### 6.8 Cập nhật ngưỡng cảnh báo tồn kho

| Thuộc tính | Giá trị |
|-----------|---------|
| **Method** | `PATCH` |
| **Endpoint** | `/api/v1/inventory/balances/{id}/threshold` |
| **Mô tả** | Thay đổi `min_level` để cảnh báo sắp hết hàng. |
| **Quyền** | `INVENTORY_MANAGE` |

**Request Body:**
```json
{ "minLevel": 5.0 }
```

| Field | Ràng buộc |
|-------|-----------|
| `minLevel` | NotNull, ≥ 0 |

---

## 👥 7. STAFF MODULE — Quản lý nhân viên

### 7.1 STAFF — Nhân viên

**Base path:** `/api/v1/staff`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 7.1.1 | `GET` | `/api/v1/staff` | Danh sách nhân viên (filter + phân trang) | `OWNER`/`ADMIN`/`BRANCH_MANAGER` |
| 7.1.2 | `GET` | `/api/v1/staff/{id}` | Chi tiết nhân viên | `OWNER`/`ADMIN`/`BRANCH_MANAGER` |
| 7.1.3 | `POST` | `/api/v1/staff` | Tạo nhân viên mới | `OWNER`/`ADMIN` |
| 7.1.4 | `PUT` | `/api/v1/staff/{id}` | Cập nhật nhân viên | `OWNER`/`ADMIN` |
| 7.1.5 | `PATCH` | `/api/v1/staff/{id}/status` | Khóa/Mở khóa nhân viên | `OWNER`/`ADMIN` |
| 7.1.6 | `DELETE` | `/api/v1/staff/{id}` | Vô hiệu hoá nhân viên (soft delete) | `OWNER` |
| 7.1.7 | `PUT` | `/api/v1/staff/{id}/roles` | Gán roles cho nhân viên (replace-all) | `OWNER` |

**GET `/api/v1/staff` — Query Params:**

| Param | Type | Mô tả |
|-------|------|-------|
| `positionId` | UUID | Lọc theo chức vụ |
| `status` | string | `ACTIVE` / `INACTIVE` |
| `keyword` | string | Tìm tên/email/SDT |
| `page` | int | mặc định 0 |
| `size` | int | mặc định 20 |

**POST `/api/v1/staff` — Request Body:**
```json
{
  "fullName": "Nguyễn Thị B",
  "phone": "0901234567",
  "email": "nhanvien@phuclong.vn",
  "positionId": "uuid-chuc-vu",
  "employeeCode": "NV-001",
  "hireDate": "2026-01-15",
  "dateOfBirth": "2000-05-20",
  "gender": "FEMALE",
  "address": "123 Lê Lợi, Q1",
  "password": "Staff@12345",
  "posPin": "1234"
}
```

| Field | Ràng buộc |
|-------|-----------|
| `fullName` | NotBlank, max 255 |
| `phone` | NotBlank, 9-11 chữ số |
| `gender` | `MALE` / `FEMALE` / `OTHER` |
| `password` | min 8, max 255 ký tự |
| `posPin` | 4-6 chữ số |

**PATCH `/api/v1/staff/{id}/status` — Request Body:**
```json
{
  "status": "INACTIVE",
  "reason": "Tạm ngưng do vi phạm nội quy"
}
```

> **Lưu ý:** `PATCH status` ≠ `DELETE`. PATCH chỉ đổi trạng thái `ACTIVE ↔ INACTIVE`. Nhân viên bị `INACTIVE` vẫn hiển thị khi filter `?status=INACTIVE`. `DELETE` là soft delete — ẩn hoàn toàn.

**PUT `/api/v1/staff/{id}/roles` — Request Body:**
```json
{ "roleIds": ["uuid-role-1", "uuid-role-2"] }
```

---

### 7.2 ROLE — Vai trò & Phân quyền

**Base path:** `/api/v1/roles`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 7.2.1 | `GET` | `/api/v1/roles` | Ma trận role-permission toàn tenant | `OWNER`/`ADMIN` |
| 7.2.2 | `POST` | `/api/v1/roles` | Tạo vai trò mới | `OWNER` |
| 7.2.3 | `PUT` | `/api/v1/roles/{id}/permissions` | Cập nhật permissions (replace-all) + ghi audit_log | `OWNER` |

**POST Request Body:**
```json
{
  "name": "Barista",
  "description": "Nhân viên pha chế"
}
```

**PUT Permissions Request Body:**
```json
{ "permissionIds": ["uuid-perm-1", "uuid-perm-2"] }
```

---

### 7.3 POSITION — Chức vụ

**Base path:** `/api/v1/positions`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 7.3.1 | `GET` | `/api/v1/positions` | Danh sách chức vụ đang active | `OWNER`/`ADMIN`/`BRANCH_MANAGER` |
| 7.3.2 | `POST` | `/api/v1/positions` | Tạo chức vụ mới | `OWNER`/`ADMIN` |
| 7.3.3 | `PUT` | `/api/v1/positions/{id}` | Cập nhật chức vụ | `OWNER`/`ADMIN` |
| 7.3.4 | `PUT` | `/api/v1/positions/{id}/toggle?active=true/false` | Bật/tắt chức vụ | `OWNER` |

**POST/PUT Request Body:**
```json
{
  "name": "Trưởng ca",
  "description": "Phụ trách ca làm việc"
}
```

---

## ⏰ 8. SHIFT MODULE — Ca làm việc

### 8.1 SHIFT TEMPLATE — Ca mẫu

**Base path:** `/api/v1/shift-templates`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 8.1.1 | `GET` | `/api/v1/shift-templates` | Danh sách ca mẫu active của branch | Authenticated |
| 8.1.2 | `POST` | `/api/v1/shift-templates` | Tạo ca mẫu mới | `OWNER`/`ADMIN`/`BRANCH_MANAGER` |
| 8.1.3 | `PUT` | `/api/v1/shift-templates/{id}` | Cập nhật ca mẫu | `OWNER`/`ADMIN`/`BRANCH_MANAGER` |
| 8.1.4 | `DELETE` | `/api/v1/shift-templates/{id}` | Deactivate ca mẫu | `OWNER`/`ADMIN` |

**POST/PUT Request Body:**
```json
{
  "name": "Ca sáng",
  "startTime": "07:00",
  "endTime": "12:00",
  "minStaff": 2,
  "maxStaff": 5,
  "color": "#FF6B6B",
  "active": true
}
```

---

### 8.2 SHIFT SCHEDULE — Lịch ca

**Base path:** `/api/v1/shifts`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 8.2.1 | `GET` | `/api/v1/shifts` | Lịch ca toàn branch (theo date range) | `OWNER`/`ADMIN`/`BRANCH_MANAGER` |
| 8.2.2 | `GET` | `/api/v1/shifts/my` | Lịch ca cá nhân | Authenticated |
| 8.2.3 | `POST` | `/api/v1/shifts` | Đăng ký ca làm việc | Authenticated |
| 8.2.4 | `POST` | `/api/v1/shifts/{id}/checkin` | Check-in bắt đầu ca | Authenticated |
| 8.2.5 | `POST` | `/api/v1/shifts/{id}/checkout` | Check-out kết thúc ca | Authenticated |

**GET `/api/v1/shifts` — Query Params:**

| Param | Type | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `startDate` | date (yyyy-MM-dd) | ✅ | Từ ngày |
| `endDate` | date (yyyy-MM-dd) | ✅ | Đến ngày |

**POST `/api/v1/shifts` — Request Body:**
```json
{
  "userId": "uuid-nhan-vien",
  "shiftTemplateId": "uuid-ca-mau",
  "date": "2026-04-20"
}
```

> **OWNER/ADMIN/BRANCH_MANAGER:** đăng ký cho bất kỳ ai  
> **WAITER/BARISTA/CASHIER:** chỉ đăng ký cho bản thân

---

### 8.3 POS SESSION — Phiên POS

**Base path:** `/api/v1/pos-sessions`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 8.3.1 | `GET` | `/api/v1/pos-sessions/active` | Phiên POS đang mở tại branch | `OWNER`/`ADMIN`/`BRANCH_MANAGER`/`CASHIER` |
| 8.3.2 | `GET` | `/api/v1/pos-sessions` | Lịch sử phiên POS | `OWNER`/`ADMIN`/`BRANCH_MANAGER` |
| 8.3.3 | `POST` | `/api/v1/pos-sessions/open` | Mở phiên POS đầu ca | `OWNER`/`ADMIN`/`BRANCH_MANAGER`/`CASHIER` |
| 8.3.4 | `POST` | `/api/v1/pos-sessions/{id}/close` | Đóng phiên POS cuối ca | `OWNER`/`ADMIN`/`BRANCH_MANAGER`/`CASHIER` |

**POST `/api/v1/pos-sessions/open` — Request Body:**
```json
{
  "startingCash": 500000,
  "shiftScheduleId": "uuid-lich-ca"
}
```

| Field | Ràng buộc |
|-------|-----------|
| `startingCash` | NotNull, ≥ 0 |
| `shiftScheduleId` | Có thể null |

**POST `/api/v1/pos-sessions/{id}/close` — Request Body:**
```json
{
  "endingCashActual": 1250000,
  "note": "Chênh lệch do sai số khi thối tiền"
}
```

| Field | Ràng buộc |
|-------|-----------|
| `endingCashActual` | NotNull, ≥ 0 |

> Hệ thống tự tính: **chênh lệch** = `endingCashActual` - `expectedCash`

---

## 🏭 9. SUPPLIER MODULE — Nhà cung cấp

### 9.1 SUPPLIER — Nhà cung cấp

**Base path:** `/api/v1/suppliers`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 9.1.1 | `GET` | `/api/v1/suppliers` | Danh sách nhà cung cấp (filter tên) | `OWNER`/`ADMIN`/`BRANCH_MANAGER` |
| 9.1.2 | `POST` | `/api/v1/suppliers` | Tạo nhà cung cấp mới | `OWNER`/`ADMIN` |
| 9.1.3 | `PUT` | `/api/v1/suppliers/{id}` | Cập nhật nhà cung cấp | `OWNER`/`ADMIN` |
| 9.1.4 | `DELETE` | `/api/v1/suppliers/{id}` | Vô hiệu hoá (soft delete) | `OWNER`/`ADMIN` |

**GET `/api/v1/suppliers` — Query Params:**

| Param | Mô tả |
|-------|-------|
| `name` | Tìm theo tên (tùy chọn) |
| `page` | mặc định 0 |
| `size` | mặc định 20 |

**POST Request Body:**
```json
{
  "name": "Công ty An Phú",
  "code": "AP-001",
  "contactName": "Nguyễn Văn C",
  "phone": "0281234567",
  "email": "contact@anphu.vn",
  "address": "456 Nguyễn Trãi, Q5",
  "taxCode": "0123456789",
  "note": "Chuyên cung cấp cà phê"
}
```

| Field | Ràng buộc |
|-------|-----------|
| `name` | NotBlank, max 200 |
| `code` | max 50 |
| `phone` | max 20 |
| `email` | max 100 |
| `taxCode` | max 20 |

---

### 9.2 PURCHASE ORDER — Đơn mua hàng

**Base path:** `/api/v1/purchase-orders`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 9.2.1 | `GET` | `/api/v1/purchase-orders` | Danh sách đơn mua hàng | `OWNER`/`ADMIN`/`BRANCH_MANAGER` |
| 9.2.2 | `POST` | `/api/v1/purchase-orders` | Tạo đơn mua hàng mới (trạng thái DRAFT) | `OWNER`/`ADMIN` |
| 9.2.3 | `GET` | `/api/v1/purchase-orders/{id}` | Chi tiết đơn mua hàng | `OWNER`/`ADMIN`/`BRANCH_MANAGER` |
| 9.2.4 | `PUT` | `/api/v1/purchase-orders/{id}` | Cập nhật đơn (chỉ khi DRAFT) | `OWNER`/`ADMIN` |
| 9.2.5 | `POST` | `/api/v1/purchase-orders/{id}/send` | Gửi đơn cho NCC (DRAFT → SENT) | `OWNER`/`ADMIN` |
| 9.2.6 | `POST` | `/api/v1/purchase-orders/{id}/receive` | Xác nhận nhận hàng (SENT → RECEIVED) — tự tạo StockBatch | `OWNER`/`ADMIN` |
| 9.2.7 | `POST` | `/api/v1/purchase-orders/{id}/cancel` | Hủy đơn mua hàng | `OWNER`/`ADMIN` |

**GET `/api/v1/purchase-orders` — Query Params:**

| Param | Mô tả |
|-------|-------|
| `branchId` | Lọc theo chi nhánh (tùy chọn, mặc định: branchId từ JWT) |
| `status` | `DRAFT` / `SENT` / `RECEIVED` / `CANCELLED` |
| `page` | mặc định 0 |
| `size` | mặc định 20 |

**POST `/api/v1/purchase-orders` — Request Body:**
```json
{
  "supplierId": "uuid-nha-cung-cap",
  "note": "Đặt hàng tuần 16/4",
  "expectedDate": "2026-04-20",
  "items": [
    {
      "itemId": "uuid-nguyen-lieu",
      "itemName": "Cà phê robusta",
      "unit": "kg",
      "quantity": 50,
      "unitPrice": 150000,
      "note": null
    }
  ]
}
```

| Field | Ràng buộc |
|-------|-----------|
| `supplierId` | NotNull |
| `items` | NotEmpty |
| `quantity` | Positive (> 0) |
| `unitPrice` | PositiveOrZero (≥ 0) |

**POST `/api/v1/purchase-orders/{id}/cancel` — Request Body:**
```json
{ "reason": "Nhà cung cấp không giao hàng đúng hạn" }
```

> **Lưu ý luồng trạng thái:** `DRAFT → SENT → RECEIVED` (hoặc `→ CANCELLED` ở bất kỳ bước nào trừ RECEIVED).  
> Khi `receive`: hệ thống tự động tạo **StockBatch** cho từng item trong đơn.

---

## 📋 10. PLAN MODULE — Gói dịch vụ

### 10.1 PLAN — Gói dịch vụ

**Base path:** `/api/v1/plans`

| # | Method | Endpoint | Mô tả | Quyền |
|---|--------|----------|-------|-------|
| 10.1.1 | `GET` | `/api/v1/plans` | Danh sách tất cả gói | ❌ Public |
| 10.1.2 | `POST` | `/api/v1/plans` | Tạo gói mới | `SYSTEM_ADMIN` |

**GET Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "basic",
      "name": "Basic",
      "price": 199000,
      "maxBranches": 1,
      "maxStaff": 10,
      "features": ["menu_management", "order_management"]
    }
  ]
}
```

---

### 10.2 SUBSCRIPTION — Gói đang dùng

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| `GET` | `/api/v1/subscriptions/current` | Gói dịch vụ hiện tại của Tenant | Authenticated |

**Response:**
```json
{
  "success": true,
  "data": {
    "tenantId": "uuid",
    "planId": "uuid",
    "planName": "Basic",
    "status": "ACTIVE",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "autoRenew": true
  }
}
```

---

## 🔌 11. WEBSOCKET — Realtime

**Endpoint:** `ws://localhost:8080/ws`  
**Giao thức:** STOMP over WebSocket

| Topic | Mô tả | Khi nào fire |
|-------|-------|-------------|
| `/topic/tables/{branchId}` | Cập nhật sơ đồ bàn realtime | Khi `PUT /positions` thành công |
| `/topic/orders/{branchId}` | Thông báo đơn hàng mới/update | Khi tạo hoặc cập nhật đơn |

**Flow khởi tạo FE:**
1. Gọi `GET /api/v1/branches/{branchId}/tables` để render sơ đồ ban đầu
2. Subscribe WebSocket topic `/topic/tables/{branchId}` để nhận update realtime

---

## ⚠️ Mã lỗi phổ biến

| HTTP Code | Error Code | Mô tả |
|-----------|-----------|-------|
| `400` | `VALIDATION_ERROR` | Request body không hợp lệ (thiếu field bắt buộc, sai format) |
| `401` | `UNAUTHORIZED` | Thiếu hoặc JWT không hợp lệ/hết hạn |
| `403` | `ACCESS_DENIED` | Không đủ quyền thực hiện thao tác này |
| `404` | `NOT_FOUND` | Resource không tồn tại hoặc không thuộc tenant |
| `409` | `CONFLICT` | Trùng dữ liệu (email đã tồn tại, tên đã dùng...) |
| `423` | `ACCOUNT_LOCKED` | Tài khoản bị khóa (sai mật khẩu > 5 lần) |
| `429` | `RATE_LIMIT` | Gửi request quá nhiều |
| `500` | `INTERNAL_ERROR` | Lỗi nội bộ hệ thống |

---

## 📌 Tóm tắt nhanh — Bảng tất cả Endpoints

| Module | Method | Endpoint | Quyền tối thiểu |
|--------|--------|----------|----------------|
| Auth | POST | `/api/v1/auth/register` | Public |
| Auth | POST | `/api/v1/auth/login` | Public |
| Auth | POST | `/api/v1/auth/refresh` | Public |
| Auth | POST | `/api/v1/auth/select-branch` | Authenticated |
| Auth | POST | `/api/v1/auth/forgot-password` | Public |
| Auth | POST | `/api/v1/auth/verify-otp` | Public |
| Auth | POST | `/api/v1/auth/reset-password` | Public |
| Auth | POST | `/api/v1/auth/pin-login` | Public |
| Branch | GET | `/api/v1/branches` | BRANCH_VIEW |
| Branch | POST | `/api/v1/branches` | BRANCH_EDIT |
| Branch | PUT | `/api/v1/branches/{id}` | BRANCH_EDIT |
| Branch | POST | `/api/v1/branches/{id}/users` | BRANCH_EDIT |
| Category | GET | `/api/v1/menu/categories` | MENU_VIEW |
| Category | GET | `/api/v1/menu/categories/active` | MENU_VIEW |
| Category | GET | `/api/v1/menu/categories/{id}` | MENU_VIEW |
| Category | POST | `/api/v1/menu/categories` | MENU_EDIT |
| Category | PUT | `/api/v1/menu/categories/{id}` | MENU_EDIT |
| Category | DELETE | `/api/v1/menu/categories/{id}` | MENU_EDIT |
| MenuItem | GET | `/api/v1/menu/items` | MENU_VIEW |
| MenuItem | GET | `/api/v1/menu/items/active` | MENU_VIEW |
| MenuItem | GET | `/api/v1/menu/items/{id}` | MENU_VIEW |
| MenuItem | GET | `/api/v1/menu/items/{id}/recipe` | MENU_VIEW |
| MenuItem | POST | `/api/v1/menu/items` | MENU_EDIT |
| MenuItem | PUT | `/api/v1/menu/items/{id}` | MENU_EDIT |
| MenuItem | DELETE | `/api/v1/menu/items/{id}` | MENU_EDIT |
| Addon | GET | `/api/v1/menu/addons` | MENU_VIEW |
| Addon | GET | `/api/v1/menu/addons/active` | MENU_VIEW |
| Addon | GET | `/api/v1/menu/addons/{id}` | MENU_VIEW |
| Addon | POST | `/api/v1/menu/addons` | MENU_EDIT |
| Addon | PUT | `/api/v1/menu/addons/{id}` | MENU_EDIT |
| Addon | DELETE | `/api/v1/menu/addons/{id}` | MENU_EDIT |
| Recipe | POST | `/api/v1/menu/recipes` | MENU_EDIT |
| Recipe | PUT | `/api/v1/menu/recipes/{id}` | MENU_EDIT |
| Recipe | DELETE | `/api/v1/menu/recipes/{id}` | MENU_EDIT |
| BranchItem | GET | `/api/v1/menu/branches/{bid}/items/{iid}` | MENU_VIEW |
| BranchItem | PUT | `/api/v1/menu/branches/{bid}/items/{iid}/price` | MENU_EDIT |
| Zone | GET | `/api/v1/branches/{bid}/zones` | ORDER_VIEW |
| Zone | GET | `/api/v1/branches/{bid}/zones/{zid}` | ORDER_VIEW |
| Zone | POST | `/api/v1/branches/{bid}/zones` | BRANCH_EDIT |
| Zone | PUT | `/api/v1/branches/{bid}/zones/{zid}` | BRANCH_EDIT |
| Zone | DELETE | `/api/v1/branches/{bid}/zones/{zid}` | BRANCH_EDIT |
| Table | GET | `/api/v1/branches/{bid}/tables` | TABLE_VIEW |
| Table | GET | `/api/v1/branches/{bid}/tables/{tid}` | TABLE_VIEW |
| Table | GET | `/api/v1/branches/{bid}/tables/stats/occupied-count` | TABLE_VIEW |
| Table | POST | `/api/v1/branches/{bid}/tables` | TABLE_EDIT |
| Table | PUT | `/api/v1/branches/{bid}/tables/{tid}` | TABLE_EDIT |
| Table | DELETE | `/api/v1/branches/{bid}/tables/{tid}` | TABLE_EDIT |
| Table | PUT | `/api/v1/branches/{bid}/tables/positions` | TABLE_EDIT |
| Order | GET | `/api/v1/orders` | ORDER_VIEW |
| Order | GET | `/api/v1/orders/{id}` | ORDER_VIEW |
| Order | POST | `/api/v1/orders` | ORDER_CREATE |
| Order | PUT | `/api/v1/orders/{id}` | ORDER_UPDATE |
| Order | PUT | `/api/v1/orders/{id}/status` | ORDER_UPDATE |
| Order | POST | `/api/v1/orders/{id}/cancel` | ORDER_CANCEL |
| Payment | POST | `/api/v1/payments/cash` | PAYMENT_CREATE |
| Payment | POST | `/api/v1/payments/qr` | PAYMENT_CREATE |
| Payment | POST | `/api/v1/payments/qr/webhook` | Public (webhook) |
| Payment | GET | `/api/v1/payments/invoices` | PAYMENT_VIEW |
| Payment | GET | `/api/v1/payments/invoices/{id}` | PAYMENT_VIEW |
| Payment | GET | `/api/v1/payments/invoices/number/{no}` | PAYMENT_VIEW |
| Payment | GET | `/api/v1/payments/{id}` | PAYMENT_VIEW |
| Inventory | POST | `/api/v1/inventory/import` | INVENTORY_IMPORT |
| Inventory | POST | `/api/v1/inventory/adjust` | INVENTORY_ADJUST |
| Inventory | POST | `/api/v1/inventory/waste` | INVENTORY_WASTE |
| Inventory | GET | `/api/v1/inventory` | INVENTORY_VIEW |
| Inventory | GET | `/api/v1/inventory/transactions` | INVENTORY_VIEW |
| Inventory | POST | `/api/v1/inventory/production-batches` | INVENTORY_IMPORT |
| Inventory | GET | `/api/v1/inventory/production-batches` | INVENTORY_VIEW |
| Inventory | GET | `/api/v1/inventory/production-batches/{id}` | INVENTORY_VIEW |
| Inventory | PATCH | `/api/v1/inventory/balances/{id}/threshold` | INVENTORY_MANAGE |
| Staff | GET | `/api/v1/staff` | OWNER/ADMIN/BRANCH_MANAGER |
| Staff | GET | `/api/v1/staff/{id}` | OWNER/ADMIN/BRANCH_MANAGER |
| Staff | POST | `/api/v1/staff` | OWNER/ADMIN |
| Staff | PUT | `/api/v1/staff/{id}` | OWNER/ADMIN |
| Staff | PATCH | `/api/v1/staff/{id}/status` | OWNER/ADMIN |
| Staff | DELETE | `/api/v1/staff/{id}` | OWNER |
| Staff | PUT | `/api/v1/staff/{id}/roles` | OWNER |
| Role | GET | `/api/v1/roles` | OWNER/ADMIN |
| Role | POST | `/api/v1/roles` | OWNER |
| Role | PUT | `/api/v1/roles/{id}/permissions` | OWNER |
| Position | GET | `/api/v1/positions` | OWNER/ADMIN/BRANCH_MANAGER |
| Position | POST | `/api/v1/positions` | OWNER/ADMIN |
| Position | PUT | `/api/v1/positions/{id}` | OWNER/ADMIN |
| Position | PUT | `/api/v1/positions/{id}/toggle` | OWNER |
| ShiftTemplate | GET | `/api/v1/shift-templates` | Authenticated |
| ShiftTemplate | POST | `/api/v1/shift-templates` | OWNER/ADMIN/BRANCH_MANAGER |
| ShiftTemplate | PUT | `/api/v1/shift-templates/{id}` | OWNER/ADMIN/BRANCH_MANAGER |
| ShiftTemplate | DELETE | `/api/v1/shift-templates/{id}` | OWNER/ADMIN |
| ShiftSchedule | GET | `/api/v1/shifts` | OWNER/ADMIN/BRANCH_MANAGER |
| ShiftSchedule | GET | `/api/v1/shifts/my` | Authenticated |
| ShiftSchedule | POST | `/api/v1/shifts` | Authenticated |
| ShiftSchedule | POST | `/api/v1/shifts/{id}/checkin` | Authenticated |
| ShiftSchedule | POST | `/api/v1/shifts/{id}/checkout` | Authenticated |
| PosSession | GET | `/api/v1/pos-sessions/active` | CASHIER trở lên |
| PosSession | GET | `/api/v1/pos-sessions` | OWNER/ADMIN/BRANCH_MANAGER |
| PosSession | POST | `/api/v1/pos-sessions/open` | CASHIER trở lên |
| PosSession | POST | `/api/v1/pos-sessions/{id}/close` | CASHIER trở lên |
| Supplier | GET | `/api/v1/suppliers` | OWNER/ADMIN/BRANCH_MANAGER |
| Supplier | POST | `/api/v1/suppliers` | OWNER/ADMIN |
| Supplier | PUT | `/api/v1/suppliers/{id}` | OWNER/ADMIN |
| Supplier | DELETE | `/api/v1/suppliers/{id}` | OWNER/ADMIN |
| PurchaseOrder | GET | `/api/v1/purchase-orders` | OWNER/ADMIN/BRANCH_MANAGER |
| PurchaseOrder | POST | `/api/v1/purchase-orders` | OWNER/ADMIN |
| PurchaseOrder | GET | `/api/v1/purchase-orders/{id}` | OWNER/ADMIN/BRANCH_MANAGER |
| PurchaseOrder | PUT | `/api/v1/purchase-orders/{id}` | OWNER/ADMIN |
| PurchaseOrder | POST | `/api/v1/purchase-orders/{id}/send` | OWNER/ADMIN |
| PurchaseOrder | POST | `/api/v1/purchase-orders/{id}/receive` | OWNER/ADMIN |
| PurchaseOrder | POST | `/api/v1/purchase-orders/{id}/cancel` | OWNER/ADMIN |
| Plan | GET | `/api/v1/plans` | Public |
| Plan | POST | `/api/v1/plans` | SYSTEM_ADMIN |
| Subscription | GET | `/api/v1/subscriptions/current` | Authenticated |

---

*📅 Cập nhật lần cuối: 2026-04-16 | SmartF&B Team*
