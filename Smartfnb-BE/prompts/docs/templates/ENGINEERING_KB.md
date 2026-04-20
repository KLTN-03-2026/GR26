# 🏗️ SmartF&B — Engineering Knowledge Base Template
> Dùng khi cần đánh giá và chốt giải pháp kỹ thuật quan trọng.
> AI dùng template này khi developer nêu vấn đề kỹ thuật phức tạp hoặc cần so sánh giải pháp.

---

## 🎯 TRIGGER

Skill này kích hoạt khi developer nói:
- "Hệ thống đang bị chậm ở [X]"
- "Nên dùng A hay B cho tính năng [X]?"
- "Có cách nào tối ưu [X] không?"
- "Viết proposal cho [X]"

---

## 📄 TEMPLATE PROPOSAL

```markdown
# 🔧 KB-{số}: {Tiêu đề vấn đề / giải pháp}
**Ngày tạo:** {date}
**Tác giả:** {tên}
**Trạng thái:** Proposal | Reviewed | Approved | Implemented
**Module liên quan:** {danh sách module}

---

## 1. 🔍 Mô tả vấn đề

### Triệu chứng hiện tại
{Mô tả vấn đề người dùng gặp phải — dùng ngôn ngữ phi kỹ thuật}

### Tác động
- **Người dùng bị ảnh hưởng:** {Ai bị ảnh hưởng? Bao nhiêu người?}
- **Tần suất xảy ra:** {Liên tục | Theo giờ cao điểm | Thỉnh thoảng}
- **Mức độ nghiêm trọng:** 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low

### Số liệu đo lường (nếu có)
| Metric | Hiện tại | Mục tiêu |
|--------|----------|----------|
| Response time | {X}ms | <{Y}ms |
| Throughput | {X} req/s | {Y} req/s |
| Error rate | {X}% | <{Y}% |

---

## 2. 🔬 Phân tích nguyên nhân gốc rễ (Root Cause Analysis)

### Nguyên nhân trực tiếp
{Nguyên nhân kỹ thuật gây ra vấn đề}

### Nguyên nhân gốc rễ
{Tại sao nguyên nhân trực tiếp xảy ra — đào sâu hơn}

### Minh họa (nếu cần)
```
[Sơ đồ luồng hoặc code snippet thể hiện vấn đề]
```

---

## 3. 🏆 Giải pháp đề xuất

### Giải pháp A: {Tên giải pháp A}

**Mô tả:** {Giải thích ngắn gọn}

**Cách thực hiện:**
```java
// Code snippet minh họa
```

| Tiêu chí | Đánh giá |
|----------|----------|
| Độ phức tạp implement | ⭐⭐⭐ (Cao) |
| Thời gian implement | X ngày |
| Chi phí vận hành | Thấp / Trung bình / Cao |
| Khả năng scale | ⭐⭐⭐⭐⭐ |
| Rủi ro | Thấp / Trung bình / Cao |

**Ưu điểm:**
- ✅ {Ưu điểm 1}
- ✅ {Ưu điểm 2}

**Nhược điểm:**
- ❌ {Nhược điểm 1}
- ❌ {Nhược điểm 2}

---

### Giải pháp B: {Tên giải pháp B}

{Cấu trúc tương tự Giải pháp A}

---

## 4. ⚖️ So sánh tổng hợp

| Tiêu chí | Giải pháp A | Giải pháp B | Giải pháp C |
|----------|-------------|-------------|-------------|
| Thời gian implement | {X ngày} | {Y ngày} | {Z ngày} |
| Complexity | Cao | Trung bình | Thấp |
| Performance gain | {X}% | {Y}% | {Z}% |
| Chi phí infra | {X} | {Y} | {Z} |
| Phù hợp timeline | ❌ | ✅ | ✅ |
| Long-term maintainability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

---

## 5. 🎯 Khuyến nghị

### Lựa chọn: Giải pháp {A/B/C}

**Lý do chọn:**
{Giải thích tại sao giải pháp này phù hợp với bối cảnh dự án}

**Điều kiện áp dụng:**
- {Điều kiện 1}
- {Điều kiện 2}

**Phương án dự phòng (Fallback):**
{Nếu giải pháp được chọn không thành công, làm gì?}

---

## 6. 📅 Kế hoạch triển khai

| Giai đoạn | Nội dung | Thời gian | Người phụ trách |
|-----------|----------|-----------|-----------------|
| 1. Chuẩn bị | {Việc cần làm} | {X ngày} | {Tên} |
| 2. Implement | {Việc cần làm} | {Y ngày} | {Tên} |
| 3. Testing | {Việc cần làm} | {Z ngày} | {Tên} |
| 4. Deploy | {Cách deploy không downtime} | {X giờ} | {Tên} |

**Rollback Plan:**
{Nếu có vấn đề sau deploy, làm thế nào để rollback nhanh?}

---

## 7. ⚠️ Rủi ro & Biện pháp giảm thiểu

| Rủi ro | Xác suất | Tác động | Biện pháp |
|--------|----------|----------|-----------|
| {Rủi ro 1} | Cao/TB/Thấp | Cao/TB/Thấp | {Biện pháp phòng ngừa} |
| {Rủi ro 2} | ... | ... | ... |

---

## 8. 📊 Định nghĩa thành công (Definition of Done)

- [ ] {Metric 1}: {Target value}
- [ ] {Metric 2}: {Target value}
- [ ] Test cases đã pass
- [ ] Load test đã pass với {X} concurrent users
- [ ] Không có regression trên các tính năng liên quan
- [ ] Đã document trong dev notes

---

## 9. 📝 Ghi chú & Tham khảo

- {Link tài liệu liên quan}
- {Bài viết kỹ thuật tham khảo}
- {Ticket / Issue liên quan}
```

---

## 📌 VÍ DỤ — "In bill xuống bếp bị chậm"

```markdown
# 🔧 KB-001: Tối ưu hệ thống gửi lệnh in bill bếp (Kitchen Display)
**Ngày tạo:** 2026-03-20
**Trạng thái:** Proposal
**Module liên quan:** order, notification

---

## 1. 🔍 Mô tả vấn đề

### Triệu chứng hiện tại
Khi thu ngân xác nhận đơn hàng, đầu bếp nhận được lệnh in/thông báo trên màn hình bếp sau 8-15 giây. Giờ cao điểm (11h-13h, 17h-20h) trễ có thể lên đến 30 giây.

### Tác động
- **Người dùng bị ảnh hưởng:** Toàn bộ nhân viên bếp + khách hàng
- **Tần suất:** Mỗi đơn hàng, trầm trọng hơn giờ cao điểm
- **Mức độ:** 🔴 Critical

| Metric | Hiện tại | Mục tiêu |
|--------|----------|----------|
| Kitchen notification latency | 8-15s | <1s |
| Concurrent orders/phút | 30 | 100 |

---

## 2. 🔬 Root Cause Analysis

### Nguyên nhân trực tiếp
- `OrderController.updateStatus()` gọi đồng bộ `PrintService.printToKitchen()`
- `PrintService` gọi API máy in qua HTTP → blocking I/O
- Tất cả xảy ra trong cùng 1 transaction DB

### Nguyên nhân gốc rễ
Không có async messaging layer. Hệ thống xử lý tuần tự: DB write → HTTP call → Response.

---

## 3. 🏆 Giải pháp

### Giải pháp A: RabbitMQ (Message Queue)
Publish domain event `OrderConfirmedEvent` vào queue. Kitchen service consume và in bill.

**Ưu điểm:** ✅ Đơn giản, phù hợp quy mô nhỏ, dễ debug
**Nhược điểm:** ❌ Single point of failure nếu không config HA

### Giải pháp B: Kafka (Event Streaming)
Publish event vào Kafka topic. Kitchen service (consumer group) consume và xử lý.

**Ưu điểm:** ✅ Throughput cao, replay được, durable
**Nhược điểm:** ❌ Phức tạp hơn, over-engineering cho quy mô hiện tại

### Giải pháp C: Spring ApplicationEvent + Virtual Thread (Async trong JVM)
Publish `ApplicationEvent`, xử lý async bằng `@Async` + Virtual Thread.

**Ưu điểm:** ✅ Không cần infra thêm, nhanh implement (1-2 ngày)
**Nhược điểm:** ❌ Mất event nếu server crash, không scale ra nhiều instance

---

## 4. ⚖️ So sánh

| Tiêu chí | RabbitMQ | Kafka | Spring Async |
|----------|----------|-------|--------------|
| Implement time | 3-4 ngày | 5-7 ngày | 1-2 ngày |
| Độ bền event | ✅ Có | ✅ Có | ❌ Không |
| Phù hợp scale hiện tại | ✅ | ❌ Over-eng | ✅ |
| Timeline 2.5 tháng | ✅ | ❌ | ✅ |

---

## 5. 🎯 Khuyến nghị

**Phase 1 (MVP — hiện tại):** Giải pháp C — Spring Async + Virtual Thread
- Implement nhanh trong 1-2 ngày
- Đủ dùng cho quy mô pilot (1-5 chi nhánh)

**Phase 2 (Scale):** Nâng cấp lên RabbitMQ khi số chi nhánh > 10

**Fallback:** Nếu async event bị mất → có retry mechanism với exponential backoff

---

## 8. Definition of Done
- [ ] Latency < 1s trong 95th percentile
- [ ] Test với 50 orders đồng thời không có event bị mất
- [ ] Không ảnh hưởng đến response time của API xác nhận đơn
```
