# BÁO CÁO ĐỐI CHIẾU BACKEND SPRINT 1
**Ngày lập:** 2026-04-14
**Phạm vi:** Sprint 1 - Nền tảng & Bán hàng
**Mục tiêu:** Liệt kê các hạng mục Sprint 1, đối chiếu trạng thái thực tế của Backend và xác định các bug/thiếu sót.

---

## 📊 MA TRẬN ĐỐI CHIẾU TỔNG QUAN

| Mã | Hạng mục | Trạng thái BE | Đánh giá | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **3.1.1** | Đăng ký / Đăng nhập | ✅ Hoàn thành | **Ổn định** | Đầy đủ AuthController, pin-login. |
| **3.1.2** | Quản lý Tenant, Chi nhánh, Nhân viên | ⚠️ Thiếu một phần | **Cần bổ sung** | Thiếu luồng cấp PIN POS, Onboarding gộp. |
| **3.1.3** | Quản lý Thực đơn | ⚠️ Thiếu một phần | **Cần bổ sung** | Thiếu Catalog nguyên liệu, Batch Recipe API. |
| **3.1.4** | Quản lý Bàn | ✅ Hoàn thành | **Ổn định** | Đã có Table/Zone Controller & Websocket. |
| **3.1.5** | Quản lý Đơn hàng | ⚠️ Thiếu một phần | **Bug/Mock** | Vẫn dùng mock trong `MenuInventoryAdapter`. |
| **3.1.6** | Thanh toán, hóa đơn | ⚠️ Thiếu một phần | **Thiếu nặng** | Thiếu Branch Payment Settings, Runtime QR API. |

---

## 🚩 CHI TIẾT BUG & THIẾU SÓT BACKEND (BE)

### 1. Nhóm Quản lý Nhân viên & Phân quyền (3.1.2)
- **Bug/Thiếu:** Không thể cấp PIN POS cho nhân viên.
  - **Chi tiết:** `CreateStaffRequest` không nhận `pinPos`. Nhân viên tạo xong không thể dùng `pin-login`.
  - **Hệ quả:** Luồng POS Quick Login bị fail với lỗi `PIN_NOT_SET`.
- **Thiếu:** API Onboarding Staff gộp.
  - **Chi tiết:** Hiện tại phải gọi nhiều API rời rạc (tạo staff $\rightarrow$ gán branch $\rightarrow$ gán role).
  - **Yêu cầu:** Cần 1 endpoint `/api/v1/staff/onboarding` để xử lý atomically.
- **Thiếu:** API danh sách staff theo chi nhánh cho POS.
  - **Chi tiết:** Thiếu `GET /api/v1/branches/{branchId}/pos-staff`.

### 2. Nhóm Quản lý Thực đơn & Kho (3.1.3)
- **Thiếu:** Catalog nguyên liệu (Inventory Items).
  - **Chi tiết:** BE hiện chỉ có import/adjust. Không có API CRUD cho danh mục nguyên liệu.
  - **Hệ quả:** Không thể tạo nguyên liệu mới trước khi nhập kho $\rightarrow$ Không thể cấu hình Recipe cho món mới.
- **Thiếu:** Batch Recipe API.
  - **Chi tiết:** `RecipeController` chỉ hỗ trợ đơn lẻ.
  - **Yêu cầu:** Cần API nhận mảng `lines` để lưu toàn bộ công thức một món trong 1 request.
- **Thiếu:** Metadata trong Recipe Response.
  - **Chi tiết:** Response chỉ trả `ingredientItemId`, buộc FE phải tự loop tìm tên nguyên liệu.

### 3. Nhóm Quản lý Đơn hàng (3.1.5)
- **Bug:** Mock tồn kho trong `MenuInventoryAdapter`.
  - **Chi tiết:** Đang hard-code trả về `1000` đơn vị cho mọi nguyên liệu.
  - **Hệ quả:** Chức năng check stock trước khi đặt món là vô nghĩa (luôn báo đủ).

### 4. Nhóm Thanh toán & Hóa đơn (3.1.6)
- **Thiếu:** Cấu hình thanh toán theo chi nhánh.
  - **Chi tiết:** Thiếu entity `BranchPaymentSetting` để lưu `apiKey`, `merchantCode`, `secretKey` riêng cho mỗi chi nhánh.
- **Thiếu:** Runtime API cho QR Payment.
  - **Chi tiết:** Thiếu API check status (`/payments/{id}/status`) và cancel QR.
- **Thiếu:** Module chi tiêu nội bộ (Store Expenses).
  - **Chi tiết:** BE chỉ có invoice bán hàng, thiếu hoàn toàn phiếu chi nội bộ (tên, số tiền, ghi chú, phương thức chi).

---

## 🛠️ DANH SÁCH TASK ƯU TIÊN CHO BE

### 🔴 P0: Critical (Phải làm ngay để nối FE)
1. [ ] **Staff:** Bổ sung `initialPosPin` vào luồng tạo/cập nhật nhân viên.
2. [ ] **Inventory:** Xây dựng CRUD Catalog nguyên liệu (`/api/v1/inventory/items`).
3. [ ] **Recipe:** Triển khai Batch Update Recipe (nhận mảng).
4. [ ] **Payment:** Xây dựng `BranchPaymentSetting` (lưu config QR/API Key theo chi nhánh).
5. [ ] **Expense:** Tạo module `store-expenses` (Phiếu chi nội bộ).

### 🟡 P1: Important (Hoàn thiện nghiệp vụ)
1. [ ] **Order:** Thay thế mock trong `MenuInventoryAdapter` bằng dữ liệu tồn kho thật.
2. [ ] **Staff:** Tạo endpoint orchestration `/api/v1/staff/onboarding`.
3. [ ] **Payment:** Thêm API polling status và cancel cho QR payment.
4. [ ] **Inventory:** Thêm API lấy lịch sử giao dịch kho và cảnh báo tồn thấp.

---

## ✅ KẾT LUẬN KIỂM TRA
Backend hiện đã có khung (skeleton) tốt cho hầu hết các module, nhưng **thiếu các API chi tiết (granular APIs)** và vẫn còn **logic mock** ở các khâu quan trọng (tồn kho, thanh toán). Để hoàn thành Sprint 1 end-to-end, Backend cần tập trung giải quyết nhóm **P0** nêu trên.
