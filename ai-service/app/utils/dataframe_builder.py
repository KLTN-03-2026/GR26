"""
DataFrame Builder — chuẩn bị và làm sạch DataFrame cho NeuralProphet.

NeuralProphet yêu cầu:
- Cột 'ds': datetime64 — không phải string
- Cột 'y': float — không có NaN, không có giá trị âm
- Cột 'ID' (Global Model): string duy nhất cho mỗi series
"""

import pandas as pd

from app.core.logging import get_logger

logger = get_logger(__name__)

# Số ngày tối thiểu mặc định để một series được coi là đủ dữ liệu
MIN_DAYS_DEFAULT = 30


def build_series_id(tenant_id: str, ingredient_id: str, branch_id: str) -> str:
    """
    Tạo ID duy nhất cho mỗi series trong Global Model.

    Args:
        tenant_id: ID tenant
        ingredient_id: ID nguyên liệu
        branch_id: ID chi nhánh

    Returns:
        String dạng "{tenant_id}__{ingredient_id}__{branch_id}"
    """
    return f"{tenant_id}__{ingredient_id}__{branch_id}"


def build_global_df(raw_df: pd.DataFrame) -> pd.DataFrame:
    """
    Làm sạch và chuẩn hóa DataFrame cho NeuralProphet Global Model.

    Các bước xử lý:
    1. Validate cột bắt buộc và kiểu dữ liệu ds
    2. Clip y âm về 0
    3. Với mỗi series: điền ngày trống (không có giao dịch) với y=0
    4. Return DataFrame sạch, sort theo (ID, ds)

    Args:
        raw_df: DataFrame với cột ['ds' (datetime64), 'y' (float), 'ID' (str)]

    Returns:
        DataFrame đã làm sạch với cột ['ds', 'y', 'ID'],
        sẵn sàng đưa vào model.fit()

    Raises:
        ValueError: Thiếu cột bắt buộc hoặc 'ds' không phải datetime
    """
    # Validate cột bắt buộc
    required_cols = {"ds", "y", "ID"}
    missing = required_cols - set(raw_df.columns)
    if missing:
        raise ValueError(f"Thiếu cột bắt buộc: {missing}")

    # Validate ds là datetime
    if not pd.api.types.is_datetime64_any_dtype(raw_df["ds"]):
        raise ValueError(
            f"Cột 'ds' phải là datetime64, hiện là {raw_df['ds'].dtype}. "
            "Dùng pd.to_datetime() để convert trước."
        )

    # Làm việc trên copy để không mutate input
    df = raw_df[["ds", "y", "ID"]].copy()
    df["y"] = df["y"].astype(float)

    # Clip y âm về 0 — tiêu thụ không thể âm
    neg_count = int((df["y"] < 0).sum())
    if neg_count > 0:
        logger.warning("Clip %d giá trị y âm về 0 trong raw_df", neg_count)
        df["y"] = df["y"].clip(lower=0.0)

    # Trường hợp DataFrame rỗng (sau validate) — trả về ngay
    if df.empty:
        return pd.DataFrame(columns=["ds", "y", "ID"])

    # Điền ngày trống cho từng series
    filled_parts: list[pd.DataFrame] = []
    for series_id, group in df.groupby("ID", sort=False):
        min_date = group["ds"].min()
        max_date = group["ds"].max()

        # Tạo full date range cho series này
        full_range = pd.DataFrame({
            "ds": pd.date_range(start=min_date, end=max_date, freq="D"),
        })

        # Left merge — ngày không có giao dịch sẽ có y=NaN → fill 0
        merged = full_range.merge(group[["ds", "y"]], on="ds", how="left")
        merged["y"] = merged["y"].fillna(0.0)
        merged["ID"] = series_id
        filled_parts.append(merged)

    result = pd.concat(filled_parts, ignore_index=True)
    result = result.sort_values(["ID", "ds"]).reset_index(drop=True)

    logger.info(
        "build_global_df: %d series → %d rows (đã điền ngày trống)",
        result["ID"].nunique(),
        len(result),
    )
    return result


def validate_series(
    df: pd.DataFrame,
    min_days: int = MIN_DAYS_DEFAULT,
) -> dict[str, bool]:
    """
    Kiểm tra từng series có đủ ngày dữ liệu để train hay không.

    Args:
        df: DataFrame với cột ['ds', 'ID']
        min_days: Ngưỡng ngày tối thiểu (mặc định 30)

    Returns:
        dict[series_id → bool]:
        - True  → series đủ ngày, có thể train
        - False → series thiếu ngày, cần dùng fallback

        Ví dụ: {"s1": True, "s2": False}

    Raises:
        ValueError: DataFrame thiếu cột 'ID' hoặc 'ds'
    """
    missing = {"ID", "ds"} - set(df.columns)
    if missing:
        raise ValueError(f"DataFrame thiếu cột: {missing}")

    # Đếm số ngày unique mỗi series
    day_counts = df.groupby("ID")["ds"].nunique()
    result: dict[str, bool] = {
        str(series_id): int(count) >= min_days
        for series_id, count in day_counts.items()
    }

    insufficient = [sid for sid, ok in result.items() if not ok]
    if insufficient:
        logger.warning(
            "%d series không đủ ngày (< %d ngày): %s%s",
            len(insufficient),
            min_days,
            insufficient[:5],
            " ..." if len(insufficient) > 5 else "",
        )
    return result


def build_future_df(
    history_df: pd.DataFrame,
    series_id: str,
    periods: int = 7,
) -> pd.DataFrame:
    """
    Xây dựng DataFrame (lịch sử + tương lai) để NeuralProphet predict.

    NeuralProphet cần n_lags hàng lịch sử để tính autoregression.
    Trả về toàn bộ lịch sử + periods hàng tương lai với y=NaN.
    Model sẽ predict vào các hàng y=NaN.

    Args:
        history_df: DataFrame lịch sử với cột 'ds' (datetime) và 'y' (float)
        series_id: ID series dạng "s{int}" — gán vào cột 'ID'
        periods: Số ngày dự báo tương lai (mặc định 7)

    Returns:
        DataFrame với cột ['ds', 'y', 'ID']:
        - Phần lịch sử: y = giá trị thực
        - Phần tương lai: y = NaN (để NeuralProphet predict)

    Raises:
        ValueError: history_df rỗng
    """
    if history_df.empty:
        raise ValueError(
            "history_df không được rỗng khi build future DataFrame. "
            "Kiểm tra data_service.get_ingredient_consumption()."
        )

    # Lấy ngày cuối cùng trong lịch sử
    last_date = pd.Timestamp(history_df["ds"].max())

    # Tạo future rows với y=NaN — NeuralProphet sẽ predict vào đây
    future_dates = pd.date_range(
        start=last_date + pd.Timedelta(days=1),
        periods=periods,
        freq="D",
    )
    future_rows = pd.DataFrame({
        "ds": future_dates,
        "y": float("nan"),
        "ID": series_id,
    })

    # Chuẩn bị history với ID column
    history_copy = history_df[["ds", "y"]].copy()
    history_copy["ID"] = series_id

    # Ghép lịch sử + tương lai, sort theo ds
    result = pd.concat([history_copy, future_rows], ignore_index=True)
    result = result.sort_values("ds").reset_index(drop=True)
    return result


def split_by_series(df: pd.DataFrame) -> dict[str, pd.DataFrame]:
    """
    Tách DataFrame tổng hợp thành dict theo từng series ID.

    Hữu ích khi cần xử lý từng series riêng lẻ (fallback predict, debug,
    hoặc predict song song từng series).

    Args:
        df: DataFrame với cột 'ID'

    Returns:
        dict[series_id → DataFrame] — index đã reset, chỉ chứa data series đó

    Raises:
        ValueError: DataFrame thiếu cột 'ID'
    """
    if "ID" not in df.columns:
        raise ValueError("DataFrame phải có cột 'ID' để split theo series.")

    return {
        str(series_id): group.reset_index(drop=True)
        for series_id, group in df.groupby("ID", sort=False)
    }
