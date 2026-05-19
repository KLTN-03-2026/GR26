# BACKEND API GAP ANALYSIS
**Ngày lập:** 2026-04-14
**Trạng thái:** 🔄 Đang cập nhật
**Mục tiêu:** Tổng hợp toàn bộ các thiếu sót, bug logic và yêu cầu bổ sung API từ phía Backend để đảm bảo tính năng Frontend vận hành đúng nghiệp vụ.

---

## 📋 TỔNG HỢP CÁC VẤN ĐỀ API

### 1. 🍔 Quản lý Thực đơn & Kho (Menu & Inventory)
| Vấn đề | Chi tiết | Mức độ | Giải pháp đề xuất |
| :--- | :--- | :---: | :--- |
| **Thiếu Catalog nguyên liệu** | BE chỉ có nhập/điều chỉnh tồn kho, thiếu CRUD danh mục nguyên liệu (`InventoryItem`). | 🔴 P0 | Xây dựng API chi tiết: `POST` (tạo mới), `PUT` (chỉnh sửa), `PUT .../toggle` (vô hiệu hóa), và `GET` (danh sách/chi tiết). |
| **Thiếu Bán thành phẩm** | Không có phân loại item (Thô/Bán thành phẩm), thiếu luồng sản xuất và Recipe đa tầng. | 🔴 P0 | Bổ sung type item và luồng `Production` (tạo bán thành phẩm từ nguyên liệu). |
| **Recipe lưu đơn lẻ** | `RecipeController` chỉ hỗ trợ CRUD từng dòng công thức. | 🔴 P0 | Thêm API Batch: `PUT /api/v1/menu/items/{itemId}/recipe` (nhận mảng lines). |
| **Recipe Response thiếu data** | Response chỉ trả `ingredientItemId`, FE phải tự loop tìm tên nguyên liệu. | 🟡 P1 | Bổ sung `ingredientName`, `unit` vào Recipe Response. |
| **Menu Active không theo CN** | `GET /api/v1/menu/items/active` chỉ lọc Global, bỏ qua trạng thái bật/tắt tại chi nhánh. | 🔴 P0 | Thêm `GET /api/v1/menu/branches/{branchId}/items/active`. |
| **Thiếu lịch sử & Cảnh báo** | Chưa có API public để đọc lịch sử giao dịch kho và danh sách cảnh báo tồn thấp. | 🟡 P1 | Thêm API: `/api/v1/inventory/transactions` và `/api/v1/inventory/alerts/low-stock`. |

### 2. 🛒 Vận hành & Bán hàng (Order & Payment)
| Vấn đề | Chi tiết | Mức độ | Giải pháp đề xuất |
| :--- | :--- | :---: | :--- |
| **Mock tồn kho khi Order** | `MenuInventoryAdapter` đang hard-code trả về `1000` $\rightarrow$ Check stock vô nghĩa. | 🔴 P0 | Thay thế mock bằng logic đọc dữ liệu tồn kho thực tế của chi nhánh. |
| **Thiếu Config Payment CN** | Không có nơi lưu `apiKey`, `merchantCode`, `secretKey` riêng cho từng chi nhánh. | 🔴 P0 | Tạo entity và API quản lý `BranchPaymentSetting`. |
| **Thiếu Runtime QR API** | Thiếu API kiểm tra trạng thái (`status`) và hủy (`cancel`) QR payment. | 🔴 P0 | Thêm API: `GET /payments/{id}/status` và `POST /payments/{id}/cancel`. |
| **Thiếu Phiếu chi nội bộ** | Thiếu hoàn toàn module quản lý chi tiêu cửa hàng (Store Expenses). | 🔴 P0 | Xây dựng module `store-expenses` với API CRUD đầy đủ. |

### 3. 💤 Vấn đề phụ / Xem xét sau (PIN & Staff)
| Vấn đề | Chi tiết | Mức độ | Giải pháp đề xuất |
| :--- | :--- | :---: | :--- |
| **Thiếu PIN POS** | `CreateStaffRequest` không nhận `pinPos`. | ⚪ Low | Bổ sung trường `initialPosPin`. |
| **Luồng Onboarding rời rạc** | Tạo staff $\rightarrow$ gán branch $\rightarrow$ gán role $\rightarrow$ cấp PIN. | ⚪ Low | Tạo `POST /api/v1/staff/onboarding`. |
| **Thiếu danh sách Staff POS** | Không có API lấy danh sách nhân viên theo chi nhánh cho POS. | ⚪ Low | Thêm `GET /api/v1/branches/{branchId}/pos-staff`. |

---

## 🚀 THỨ TỰ ƯU TIÊN TRIỂN KHAI (BACKLOG)

### 🔴 Giai đoạn 1: Critical (Chặn tiến độ FE)
- [ ] Cấp/Sửa PIN POS cho Staff.
- [ ] Xây dựng Catalog nguyên liệu.
- [ ] Triển khai Batch Recipe API.
- [ ] Sửa API Menu Active theo chi nhánh.
- [ ] Xây dựng `BranchPaymentSetting` & Module Chi tiêu nội bộ.
- [ ] Bỏ mock tồn kho trong luồng Order.

### 🟡 Giai đoạn 2: Improvement (Hoàn thiện UX/Nghiệp vụ)
- [ ] API Onboarding Staff gộp.
- [ ] API danh sách Staff cho POS login.
- [ ] Runtime API cho QR (Status/Cancel).
- [ ] Enrich metadata cho Recipe Response.
- [ ] Lịch sử giao dịch kho & Cảnh báo tồn thấp.

---
**Ghi chú:** Report này sẽ được cập nhật liên tục khi phát hiện thêm các khoảng trống API trong quá trình tích hợp Frontend.
