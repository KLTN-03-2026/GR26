# Kế hoạch: Xây dựng Report Pages & Owner Dashboard

## Bức tranh hiện tại

Sau khi phân tích codebase, tôi thấy:

- ✅ **Đã có:** `RevenueReportDashboard`, `InventoryReportDashboard`, `HrReportDashboard` — đều có skeleton cơ bản
- ✅ **Đã có:** Hooks cho revenue (4 hooks), inventory (3 hooks: stock, expiring, waste), HR (3 hooks: attendance, cost, violations)
- ❌ **Thiếu service + hook** cho: `inventory/movement`, `inventory/cogs`, `hr/payroll`, `hr/checkin-history`
- ⚠️ **Dashboard hiện tại** (`ReportsOverviewDashboard`) chỉ là trang trung chuyển đơn giản, chưa xứng tầm "trang đầu tiên Owner thấy"

---

## Đề xuất thiết kế Dashboard Owner

Khi Owner đăng nhập, dashboard cần truyền đạt **toàn cảnh hoạt động kinh doanh trong 1 màn hình**:

```
┌─────────────────────────────────────────────────────────────────┐
│  Chào [Tên Owner]!   Chi nhánh: [Dropdown]  [Hôm nay]  [Refresh]│
├──────────┬──────────┬──────────┬─────────────────────────────── ┤
│ Doanh    │ Tổng     │ Cảnh     │ Chi phí nhân sự tháng này       │
│ thu hôm  │ đơn hôm  │ báo kho  │                                 │
│ nay      │ nay      │ (alerts) │                                 │
├──────────┴──────────┴──────────┴─────────────────────────────── ┤
│ Biểu đồ doanh thu theo giờ (HourlyRevenueChart - full width)    │
├─────────────────────────┬───────────────────────────────────────┤
│ Top 5 món bán chạy      │ Tỷ trọng thanh toán (PieChart)        │
├─────────────────────────┼───────────────────────────────────────┤
│ Tồn kho cần chú ý       │ Vi phạm chấm công gần đây             │
├─────────────────────────┴───────────────────────────────────────┤
│ Quick Actions: [Bao cao DT] [Bao cao Kho] [Bao cao NS]          │
└─────────────────────────────────────────────────────────────────┘
```

**Key insight:** Dashboard không chỉ là "link đến các trang khác" mà phải là **command center** thực sự, hiển thị dữ liệu live từ tất cả 3 domain.

---

## Open Questions

> [!IMPORTANT]
> **Câu hỏi 1:** Dashboard có cần selector "Tất cả chi nhánh" hay chỉ 1 chi nhánh tại một thời điểm? Backend hỗ trợ `branchId = null` (all branches) nhưng UI sẽ phức tạp hơn.

> [!IMPORTANT]
> **Câu hỏi 2:** Dashboard có cần auto-refresh (mỗi X phút) hay chỉ manual refresh?

> [!NOTE]
> **Câu hỏi 3:** Với Inventory Report và HR Report — bạn muốn thêm **tab con bên trong trang** (Tab Tồn kho / COGS / Biến động) hay tách thành **route riêng biệt**?

---

## Proposed Changes

### Phase 1 — Services & Hooks (bổ sung phần còn thiếu)

#### [MODIFY] [reportService.ts](file:///Users/hoangnguyen/workspace/FinalYearProject/GR26/smartfb-frontend/src/modules/report/services/reportService.ts)
Bổ sung 4 API calls còn thiếu:
- `getInventoryMovement(params)` — `GET /reports/inventory/movement`
- `getCogs(params)` — `GET /reports/inventory/cogs`
- `getPayrollReport(params)` — `GET /reports/hr/payroll`
- `getCheckinHistory(params)` — `GET /reports/hr/checkin-history`

#### [MODIFY] report.types.ts
Thêm TypeScript types cho 4 API mới (InventoryMovementItem, CogsItem, PayrollReportItem, CheckinHistoryItem).

#### [NEW] `useInventoryMovement.ts` + `useCogs.ts`
Hook React Query wrapper cho 2 API inventory mới.

#### [MODIFY] [useHrReports.ts](file:///Users/hoangnguyen/workspace/FinalYearProject/GR26/smartfb-frontend/src/modules/report/hooks/useHrReports.ts)
Thêm `usePayrollReport` và `useCheckinHistory`.

---

### Phase 2 — Nâng cấp Dashboard Owner

#### [MODIFY] [ReportsOverviewDashboard.tsx](file:///Users/hoangnguyen/workspace/FinalYearProject/GR26/smartfb-frontend/src/modules/report/components/ReportsOverviewDashboard.tsx)

Thiết kế lại hoàn toàn thành **Executive Dashboard** với:
- **Header:** Lời chào có tên, ngày giờ hiện tại, branch selector, nút refresh
- **Row 1 — KPI Cards (4 cards):**
  - Doanh thu hôm nay (từ `/reports/revenue`)
  - Tổng đơn hôm nay (từ `/reports/revenue`)
  - Chi phí nhân sự tháng này (từ `/reports/hr/cost`)
  - Cảnh báo kho: stock LOW/OUT + expiring (từ `/reports/inventory` + `/reports/inventory/expiring`)
- **Row 2 — Hourly Chart:** Full-width từ `/reports/revenue/hourly-heatmap`
- **Row 3 — Split 50/50:** Top 5 món (left, `/reports/top-items`) + Payment pie (right, `/reports/payment-breakdown`)
- **Row 4 — Alerts Split:** Tồn kho rủi ro (left) + Vi phạm gần đây (right, `/reports/hr/violations`)
- **Row 5 — Quick Actions:** 3 card điều hướng đến Revenue/Inventory/HR Report

**Thay đổi chính so với hiện tại:**
| Hiện tại | Sau nâng cấp |
|---|---|
| 4 KPI cards (revenue only) | 4 KPI cards (revenue + HR + kho) |
| 3 card link đến trang báo cáo | Hourly chart + Top items + Payment pie |
| Bảng trạng thái dữ liệu (dry) | Tồn kho rủi ro + Vi phạm alert |
| Không có HR data | HR cost KPI + violations panel |

---

### Phase 3 — Revenue Report (nâng cấp minor)

#### [MODIFY] [RevenueReportDashboard.tsx](file:///Users/hoangnguyen/workspace/FinalYearProject/GR26/smartfb-frontend/src/modules/report/components/RevenueReportDashboard.tsx)

Bổ sung:
- `ReportNavigationTabs` ở đầu trang (giống Inventory/HR đã có)
- Kicker label "Doanh thu" + title thống nhất style

---

### Phase 4 — Inventory Report (nâng cấp với tabs)

#### [MODIFY] [InventoryReportDashboard.tsx](file:///Users/hoangnguyen/workspace/FinalYearProject/GR26/smartfb-frontend/src/modules/report/components/InventoryReportDashboard.tsx)

Thêm tab switcher nội trang:
- **Tab "Tồn kho"** (hiện tại) — stock list, expiring, waste
- **Tab "Biến động kho"** (mới) — table từ `/reports/inventory/movement` với filter date range + groupBy
- **Tab "COGS"** (mới) — table từ `/reports/inventory/cogs` với filter date range, pagination

---

### Phase 5 — HR Report (nâng cấp với sections mới)

#### [MODIFY] [HrReportDashboard.tsx](file:///Users/hoangnguyen/workspace/FinalYearProject/GR26/smartfb-frontend/src/modules/report/components/HrReportDashboard.tsx)

Thêm 2 section accordion/tab:
- **Bảng lương:** Table từ `/reports/hr/payroll` với filter month + staffId, hiển thị baseSalary, OT, bonus, gross
- **Lịch sử checkin:** Table từ `/reports/hr/checkin-history` với filter date range + staffId

---

## Verification Plan

### Automated
```bash
cd smartfb-frontend && npm run build
cd smartfb-frontend && npm run lint
```

### Manual
- Chạy `npm run dev`, đăng nhập Owner
- Dashboard: kiểm tra 4 KPI, hourly chart, top items, payment pie, stock alerts, violations
- Revenue: kiểm tra tab nav, KPI, charts
- Inventory: kiểm tra 3 tabs (stock/movement/COGS)
- HR: kiểm tra attendance table, payroll table, checkin history
