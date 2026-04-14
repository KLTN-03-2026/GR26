"""
Endpoint dự báo tiêu thụ nguyên liệu.
Chỉ ĐỌC từ bảng forecast_results — KHÔNG chạy model realtime.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant, get_db
from app.core.security import TokenPayload

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.get("/{branch_id}")
async def get_branch_forecast(
    branch_id: str,
    db: AsyncSession = Depends(get_db),
    tenant: TokenPayload = Depends(get_current_tenant),
) -> dict:
    """
    Lấy kết quả dự báo 7 ngày tới của tất cả nguyên liệu tại chi nhánh.
    Kết quả đọc từ bảng forecast_results (đã tính sẵn bởi predict job).

    Args:
        branch_id: ID của chi nhánh cần lấy dự báo

    Returns:
        ForecastResponse với danh sách nguyên liệu và dự báo từng ngày
    """
    # TODO: implement trong sprint predict
    raise NotImplementedError("Endpoint chưa implement — chờ predict_service")


@router.get("/{branch_id}/{ingredient_id}")
async def get_ingredient_forecast(
    branch_id: str,
    ingredient_id: str,
    db: AsyncSession = Depends(get_db),
    tenant: TokenPayload = Depends(get_current_tenant),
) -> dict:
    """
    Lấy dự báo 7 ngày của 1 nguyên liệu cụ thể tại chi nhánh.

    Args:
        branch_id: ID chi nhánh
        ingredient_id: ID nguyên liệu cụ thể
    """
    # TODO: implement trong sprint predict
    raise NotImplementedError("Endpoint chưa implement — chờ predict_service")
