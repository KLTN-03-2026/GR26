"""
Pytest fixtures dùng chung cho tất cả test files.
"""

import pandas as pd
import pytest


@pytest.fixture
def sample_forecast_df() -> pd.DataFrame:
    """
    DataFrame mẫu giả lập output của NeuralProphet predict().
    Dùng để test stock_calculator mà không cần chạy model thật.
    """
    dates = pd.date_range(start="2026-04-15", periods=7, freq="D")
    return pd.DataFrame({
        "ds": dates,
        "yhat1": [10.5, 12.0, 9.8, 11.2, 13.0, 8.5, 10.0],
    })


@pytest.fixture
def sample_consumption_df() -> pd.DataFrame:
    """
    DataFrame lịch sử tiêu thụ mẫu — đầu vào cho train.
    Đủ 30 ngày để vượt ngưỡng MIN_DAYS_REQUIRED.
    """
    dates = pd.date_range(start="2026-03-01", periods=45, freq="D")
    import random
    random.seed(42)
    return pd.DataFrame({
        "ds": dates,
        "y": [round(random.uniform(8.0, 15.0), 1) for _ in range(45)],
        "ID": ["tenant1__ing_001__branch_q1"] * 45,
    })
