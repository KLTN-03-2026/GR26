# Plan: app/api/v1/forecast.py — 3 endpoints
> Ngày: 2026-04-15 | Session 5 — TASK B

## Nguyên tắc bắt buộc
- Chỉ ĐỌC từ bảng forecast_results — KHÔNG chạy model
- Response time < 200ms — query đơn giản, index có sẵn
- Trường hợp rỗng: trả 200 + message, KHÔNG 404/500

## 3 Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/forecast/{branch_id}` | Full 7-ngày cho tất cả nguyên liệu |
| GET | `/forecast/{branch_id}/summary` | Count theo urgency, không có chi tiết |
| GET | `/forecast/{branch_id}/{ingredient_id}` | 7 ngày cho 1 nguyên liệu |

## SQL query chính

```sql
SELECT
    asr.ingredient_id,
    i.name              AS ingredient_name,
    i.unit,
    fr.forecast_date,
    fr.predicted_qty,
    fr.stockout_date,
    fr.suggested_qty,
    COALESCE(ib.quantity, 0.0)  AS current_stock
FROM forecast_results fr
JOIN ai_series_registry asr ON asr.id = fr.series_id
JOIN items i ON i.id::text = asr.ingredient_id
LEFT JOIN inventory_balances ib
    ON ib.item_id::text = asr.ingredient_id
    AND ib.branch_id::text = :branch_id
    AND ib.tenant_id = :tenant_id
WHERE asr.branch_id = :branch_id
  AND fr.forecast_date >= :today
ORDER BY i.name ASC, fr.forecast_date ASC
```

## Logic xử lý

1. Chạy query → nhóm rows theo ingredient_id
2. Mỗi ingredient: tính urgency từ stockout_date (stock_calculator.get_urgency)
3. Tính suggested_order_date từ stockout_date (stock_calculator.calc_suggested_order_date)
4. is_fallback → không lưu DB, mặc định False
5. Gọi model_io.get_train_metadata(tenant_id) → lấy last_trained_at
6. Log thời gian xử lý

## Files bị ảnh hưởng
| File | Thay đổi |
|------|----------|
| `app/api/v1/forecast.py` | Implement 3 endpoints |
| `app/main.py` | Routers đã được mount ✅ (kiểm tra lại) |
