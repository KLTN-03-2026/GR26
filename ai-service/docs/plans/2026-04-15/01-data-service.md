# Plan: Implement data_service.py

**Status:** ✅ DONE
**Service:** ai-service
**Ngày bắt đầu:** 15/04/2026
**Assignee:** @hoang

---

## Mô tả

Viết lại `app/services/data_service.py` để:
- Dùng đúng đường join: `orders → order_items → recipes → items` (thay SALE_DEDUCT cũ)
- Tích hợp `AiSeriesRegistry` — mỗi (ingredient × branch) map sang `series_id = "s{int}"`
- Đọc consumption gần nhất từ `consumption_history` (AI-owned, nhanh hơn)
- Điền ngày thiếu với `y=0` để NeuralProphet không bị gap

---

## Query tiêu thụ chính (orders path)

```sql
SELECT
    DATE(o.completed_at)             AS ds,
    r.ingredient_item_id::text       AS ingredient_id,
    o.branch_id::text                AS branch_id,
    SUM(oi.quantity * r.quantity)    AS y   -- item_sold × recipe_qty = ingredient_consumed
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN recipes r      ON r.target_item_id = oi.item_id
                   AND r.tenant_id      = o.tenant_id
WHERE o.tenant_id    = :tenant_id
  AND o.status       = 'COMPLETED'
  AND o.completed_at >= :start_date
GROUP BY DATE(o.completed_at), r.ingredient_item_id, o.branch_id
ORDER BY ds ASC
```

---

## Các hàm cần implement

| Hàm | Input | Output | Nguồn dữ liệu |
|-----|-------|--------|---------------|
| `get_all_consumption_for_tenant` | tenant_id, days_back | DataFrame [ds, y, ID] | orders→recipes (BE) + upsert consumption_history |
| `get_recent_consumption` | series_id: str, days | DataFrame [ds, y] | consumption_history (AI) |
| `get_current_stock` | tenant_id, branch_id, ingredient_id | float | inventory_balances (BE) |
| `get_active_ingredients` | tenant_id, branch_id | list[dict] với series_id | items + inventory_balances + series_registry |
| `get_active_tenants` | — | list[str] | tenants (BE) |
| `get_branch_coordinates` | branch_id | (lat, lng) \| None | branches (BE) |

---

## Files ảnh hưởng

- [x] `app/services/data_service.py`      — rewrite hoàn toàn
- [x] `tests/test_data_service.py`         — 20 tests passed
- [x] `requirements.txt`                   — thêm pytest, pytest-asyncio
- [x] `app/services/train_service.py`      — cập nhật import theo API mới

---

## Logic "fill missing days"

```python
# Sau khi query, với mỗi series tạo date range đầy đủ
full_range = pd.date_range(start=start_date, end=today, freq="D")
df = df.set_index("ds").reindex(full_range, fill_value=0).reset_index()
df.columns = ["ds", "y"]
```

---

## Luồng `get_all_consumption_for_tenant`

```
1. Query orders→order_items→recipes → raw rows (ds, ingredient_id, branch_id, y)
2. Nhóm thành dict: (ingredient_id, branch_id) → list[row]
3. Với mỗi unique pair: gọi SeriesRegistryRepo.get_or_create() → lấy series_id
4. Build DataFrame per-series với fill_missing_days()
5. Concat tất cả → 1 DataFrame [ds, y, ID]
6. Upsert vào consumption_history (INSERT ON CONFLICT DO UPDATE)
7. Return DataFrame
```

---

## Test strategy

- Dùng `AsyncMock` cho DB session — không cần PostgreSQL thật
- Test từng hàm độc lập với data giả
- Focus vào: fill_missing_days, series_id mapping, empty-data edge case
