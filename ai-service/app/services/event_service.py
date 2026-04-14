"""
Event Service — quản lý sự kiện đặc biệt ảnh hưởng đến dự báo.

Ví dụ: khai trương, khuyến mãi, ngày lễ riêng của quán.
Các sự kiện này được chủ quán khai báo và thêm vào NeuralProphet như Regressors.
"""

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger

logger = get_logger(__name__)


async def get_branch_events(
    db: AsyncSession,
    tenant_id: str,
    branch_id: str,
    start_date: date,
    end_date: date,
) -> list[dict]:
    """
    Lấy danh sách sự kiện của chi nhánh trong khoảng thời gian.

    Args:
        tenant_id: BẮT BUỘC filter
        branch_id: ID chi nhánh
        start_date: Ngày bắt đầu khoảng cần lấy
        end_date: Ngày kết thúc khoảng cần lấy

    Returns:
        List[dict] với keys: event_type, start_date, end_date
    """
    # TODO: implement trong sprint event
    raise NotImplementedError
