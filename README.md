# SmartF&B

README sơ bộ cho dự án SmartF&B, dùng làm điểm vào chung cho thành viên mới và làm chuẩn làm việc nhóm.

## 1. Tổng quan

SmartF&B là hệ thống quản lý F&B/POS theo hướng multi-tenant, gồm backend quản lý nghiệp vụ và frontend cho vận hành giao diện người dùng.

### Thành phần chính

- `Smartfnb-BE`: backend Spring Boot 3.3, Java 21, PostgreSQL, Redis, Flyway, Swagger
- `smartfb-frontend`: frontend React 19, TypeScript, Vite, Zustand, React Query, Tailwind CSS
- `docs`: tài liệu sprint, bug report, prompt và ghi chú kỹ thuật
- `report`: tài liệu báo cáo dự án
- `images`: hình ảnh phục vụ tài liệu hoặc demo

## 2. Cấu trúc thư mục

```text
GR26/
├── Smartfnb-BE/         # Backend API
├── smartfb-frontend/    # Frontend web app
└── README.md            # README tổng quan của repo
```

## 3. Công nghệ sử dụng

### Backend

- Java 21
- Spring Boot 3.3.5
- Spring Security
- Spring Data JPA
- PostgreSQL 16
- Redis 7
- Flyway
- SpringDoc OpenAPI / Swagger

### Frontend

- React 19
- TypeScript
- Vite
- Zustand
- TanStack React Query
- Tailwind CSS 4
- React Router
- Axios

## 4. Chạy dự án cục bộ

### Yêu cầu môi trường

- Java 21
- Maven
- Node.js + npm
- Docker Desktop hoặc Docker Engine

### Chạy backend

1. Di chuyển vào thư mục [Smartfnb-BE](./Smartfnb-BE)
2. Khởi động hạ tầng:

```bash
docker compose up -d postgres redis
```

3. Chạy ứng dụng:

```bash
mvn spring-boot:run
```

Backend mặc định chạy tại `http://localhost:8080`.

Swagger UI:

- `http://localhost:8080/swagger-ui.html`

### Chạy frontend

1. Di chuyển vào thư mục [smartfb-frontend](./smartfb-frontend)
2. Cài dependencies:

```bash
npm install
```

3. Tạo file `.env` từ `.env.example` nếu cần
4. Chạy môi trường dev:

```bash
npm run dev
```

Frontend hiện đang cấu hình API mặc định tới `http://localhost:3000/api`, cần điều chỉnh `VITE_API_BASE_URL` nếu backend chạy ở cổng khác.

## 5. Tài liệu liên quan

- Tài liệu backend: [Smartfnb-BE/README.md](./Smartfnb-BE/README.md)
- Tài liệu frontend: [smartfb-frontend/README.md](./smartfb-frontend/README.md)
- Tài liệu nhóm: [docs](./docs)

## 6. Luồng Git

### Mô hình nhánh

Luồng chính của dự án:

```text
main -> dev -> feature/xxx
```

Ý nghĩa từng nhánh:

- `main`: nhánh production, chỉ nhận merge khi có bản release ổn định như `v1.0`, `v2.0`
- `dev`: nhánh tích hợp, nơi gom toàn bộ chức năng trước khi chuẩn bị release
- `feature/xxx`: nhánh phát triển tính năng, tách từ `dev`, hoàn thành xong thì merge request ngược lại vào `dev`

### Quy tắc nhanh

- Không commit thẳng lên `main`
- Không commit thẳng lên `dev`
- Mọi thay đổi phải đi qua nhánh riêng và merge request
- Tên nhánh nên rõ nghĩa, ngắn gọn, bám theo chức năng hoặc lỗi

### Quy ước đặt tên nhánh

- `feature/ten-chuc-nang`
- `fix/ten-loi`
- `hotfix/ten-su-co`

Ví dụ:

- `feature/login-owner`
- `feature/menu-management`
- `fix/otp-403`
- `hotfix/payment-timeout`

### Luồng làm việc hằng ngày

1. Cập nhật `dev` mới nhất

```bash
git checkout dev
git pull origin dev
```

2. Tạo nhánh chức năng từ `dev`

```bash
git checkout -b feature/ten-chuc-nang
```

3. Làm việc, commit theo từng phần nhỏ, có ý nghĩa

```bash
git add .
git commit -m "feat: them chuc nang ..."
```

4. Đẩy nhánh lên remote

```bash
git push origin feature/ten-chuc-nang
```

5. Tạo merge request từ `feature/ten-chuc-nang` vào `dev`

6. Sau khi `dev` đã ổn định và qua kiểm thử, tạo release merge từ `dev` vào `main`

### Luồng hotfix khẩn

Khi phát sinh lỗi production:

1. Tách nhánh từ `main`

```bash
git checkout main
git pull origin main
git checkout -b hotfix/ten-su-co
```

2. Sửa lỗi và tạo merge request vào `main`
3. Sau khi merge vào `main`, bắt buộc merge tiếp phần hotfix đó vào `dev` để tránh lệch nhánh

```text
main -> hotfix/xxx -> merge vào main
                     -> merge tiếp vào dev
```

## 7. Nguyên tắc cộng tác

- Luôn pull nhánh gốc trước khi tách nhánh mới
- Mỗi nhánh chỉ nên phục vụ một mục tiêu rõ ràng
- Commit message nên theo dạng `feat`, `fix`, `refactor`, `docs`, `test`
- Không đưa file build hoặc file môi trường nhạy cảm lên repository
- Ưu tiên merge request có mô tả ngắn: mục tiêu, phạm vi sửa, cách test

## 8. Gợi ý commit message

```text
feat: them giao dien dang nhap
fix: sua loi xac thuc otp 403
docs: cap nhat readme va git workflow
refactor: tach auth service
test: bo sung test cho menu module
```

## 9. Ghi chú

README này là bản sơ bộ. Khi dự án ổn định hơn, nên bổ sung thêm:

- sơ đồ kiến trúc hệ thống
- checklist setup môi trường đầy đủ
- quy trình release
- quy ước code style và review
- danh sách module và trạng thái triển khai
