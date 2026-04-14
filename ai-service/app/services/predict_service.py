"""
Predict Service — dự báo tiêu thụ và tính gợi ý nhập kho.

Quy trình:
1. Load model từ storage/models/{tenant_id}/global_model.np
2. Predict 7 ngày tới cho từng nguyên liệu × chi nhánh
3. Lấy tồn kho hiện tại
4. Tính ngày hết hàng và số lượng gợi ý nhập
5. Ghi vào bảng forecast_results (upsert)
"""

import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger

logger = get_logger(__name__)


async def predict_and_save(
    db: AsyncSession,
    tenant_id: str,
    branch_id: str,
) -> int:
    """
    Chạy predict cho tất cả nguyên liệu của chi nhánh và lưu kết quả.

    Args:
        db: AsyncSession
        tenant_id: BẮT BUỘC filter
        branch_id: ID chi nhánh cần predict

    Returns:
        Số lượng records đã ghi vào forecast_results
    """
    # TODO: implement trong sprint predict
    raise NotImplementedError
