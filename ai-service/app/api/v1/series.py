"""
Series debug endpoint — xem mapping series registry của 1 chi nhánh.

Dùng để kiểm tra (ingredient_id × branch_id) → series_id mapping.
Không cần auth vì đây là endpoint nội bộ / debug.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.repositories.series_registry_repo import SeriesRegistryRepo

router = APIRouter(prefix="/series", tags=["Series Registry (Debug)"])


@router.get("/{branch_id}")
async def list_series_by_branch(
    branch_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """
    Liệt kê tất cả series đã đăng ký của chi nhánh.

    Dùng để debug mapping (ingredient_id × branch_id) → series_id.

    Args:
        branch_id: UUID string của chi nhánh

    Returns:
        List dict với id, series_id, ingredient_id, branch_id, created_at
    """
    repo = SeriesRegistryRepo(db)
    records = await repo.get_all_by_branch(branch_id)

    return [
        {
            "id": r.id,
            "series_id": r.series_id,       # "s{id}"
            "ingredient_id": r.ingredient_id,
            "branch_id": r.branch_id,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]


@router.get("/{branch_id}/{series_id}")
async def get_series_detail(
    branch_id: str,
    series_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Lấy thông tin 1 series theo series_id (dạng "s42").

    Args:
        branch_id: UUID string của chi nhánh (dùng để validate ownership)
        series_id: series_id dạng "s{int}", VD: "s1", "s42"

    Returns:
        dict thông tin series hoặc 404 nếu không tìm thấy
    """
    from fastapi import HTTPException, status

    repo = SeriesRegistryRepo(db)

    try:
        record = await repo.get_by_series_id(series_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if record is None or record.branch_id != branch_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy series {series_id!r} trong branch {branch_id!r}",
        )

    return {
        "id": record.id,
        "series_id": record.series_id,
        "ingredient_id": record.ingredient_id,
        "branch_id": record.branch_id,
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }
