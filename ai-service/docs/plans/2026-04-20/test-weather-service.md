# Plan: test_weather_service.py

**Ngày**: 2026-04-20
**File**: `tests/test_weather_service.py`

## Mục tiêu

Viết unit tests cho `app/services/weather_service.py` — kiểm tra tất cả nhánh
logic của `fetch_weather_for_branch()` và `get_weather_df()` mà không cần
kết nối DB thật hay gọi Open-Meteo API thật.

## Phân tích implementation

`fetch_weather_for_branch` thực hiện 5 bước tuần tự:
1. Truy vấn `branches` lấy lat/lng → `db.execute` #1
2. Kiểm tra cache hôm nay → `db.execute` #2
3. Gọi `httpx.AsyncClient.get()` nếu chưa có cache
4. Parse JSON response
5. UPSERT từng ngày → `db.execute` #3..N + `db.commit()`

`get_weather_df` thực hiện 1 truy vấn → trả DataFrame hoặc None.

## Chiến lược mock

| Thứ cần mock | Cách mock |
|---|---|
| `db.execute` | `AsyncMock` với `side_effect=[result1, result2, ...]` |
| `db.commit` | `AsyncMock` mặc định trên `AsyncMock()` |
| `httpx.AsyncClient` | `patch("app.services.weather_service.httpx.AsyncClient")` |

## Danh sách tests (7 tests)

| # | Test | Kịch bản |
|---|---|---|
| 1 | `test_fetch_weather_no_coordinates` | coord query trả None → return False ngay |
| 2 | `test_fetch_weather_cache_hit` | cache đã có hôm nay → return True, không gọi httpx |
| 3 | `test_fetch_weather_api_success` | API trả JSON hợp lệ → UPSERT 3 ngày, return True |
| 4 | `test_fetch_weather_api_timeout` | httpx raise TimeoutException → return False |
| 5 | `test_fetch_weather_api_error_response` | httpx status 429 → raise_for_status → return False |
| 6 | `test_get_weather_df_returns_dataframe` | DB có rows → trả DataFrame đúng cột |
| 7 | `test_get_weather_df_no_data` | DB rỗng → trả None |

## File ảnh hưởng

- `tests/test_weather_service.py` — tạo mới
