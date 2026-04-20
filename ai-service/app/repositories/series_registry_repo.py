"""
SeriesRegistryRepo — thao tác CRUD với bảng ai_series_registry.

Nguyên tắc:
- get_or_create dùng INSERT ... ON CONFLICT DO NOTHING để an toàn với race condition
- Mọi method đều async — nhất quán với phần còn lại của AI Service
"""

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.series_registry import AiSeriesRegistry

logger = get_logger(__name__)


class SeriesRegistryRepo:
    """Repository thao tác với ai_series_registry."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_or_create(
        self,
        ingredient_id: str,
        branch_id: str,
    ) -> AiSeriesRegistry:
        """
        Lấy hoặc tạo mới record cho cặp (ingredient_id × branch_id).

        Dùng INSERT ... ON CONFLICT DO NOTHING để tránh race condition
        khi nhiều job chạy song song cùng insert cùng 1 series.

        Args:
            ingredient_id: UUID string của nguyên liệu (từ items.id của BE)
            branch_id: UUID string của chi nhánh (từ branches.id của BE)

        Returns:
            AiSeriesRegistry instance (existing hoặc newly created)
        """
        # Thử lấy trước — happy path (record đã tồn tại)
        existing = await self._find(ingredient_id, branch_id)
        if existing:
            return existing

        # INSERT ON CONFLICT DO NOTHING — an toàn với concurrent insert
        await self.db.execute(
            text("""
                INSERT INTO ai_series_registry (ingredient_id, branch_id)
                VALUES (:ingredient_id, :branch_id)
                ON CONFLICT ON CONSTRAINT uq_series_ing_branch DO NOTHING
            """),
            {"ingredient_id": ingredient_id, "branch_id": branch_id},
        )
        await self.db.flush()

        # Sau insert (hoặc conflict), lấy record thật
        record = await self._find(ingredient_id, branch_id)
        if record is None:
            # Không nên xảy ra — log error và raise
            raise RuntimeError(
                f"get_or_create thất bại: ingredient={ingredient_id} branch={branch_id}"
            )

        logger.info(
            "Series registry: ingredient=%s branch=%s → %s",
            ingredient_id, branch_id, record.series_id,
        )
        return record

    async def get_by_series_id(self, series_id: str) -> AiSeriesRegistry | None:
        """
        Lấy record theo series_id dạng string "s{int}".
        VD: "s42" → query WHERE id = 42

        Args:
            series_id: string dạng "s42", "s1", ...

        Returns:
            AiSeriesRegistry hoặc None nếu không tìm thấy

        Raises:
            ValueError: series_id không đúng format
        """
        if not series_id.startswith("s"):
            raise ValueError(f"series_id phải có dạng 's{{int}}', nhận: {series_id!r}")

        try:
            record_id = int(series_id[1:])
        except ValueError as exc:
            raise ValueError(
                f"series_id không hợp lệ: {series_id!r} — phần số không phải integer"
            ) from exc

        result = await self.db.execute(
            select(AiSeriesRegistry).where(AiSeriesRegistry.id == record_id)
        )
        return result.scalar_one_or_none()

    async def get_all_by_branch(self, branch_id: str) -> list[AiSeriesRegistry]:
        """
        Lấy tất cả series thuộc một chi nhánh.

        Args:
            branch_id: UUID string của chi nhánh

        Returns:
            List AiSeriesRegistry, sắp xếp theo id tăng dần
        """
        result = await self.db.execute(
            select(AiSeriesRegistry)
            .where(AiSeriesRegistry.branch_id == branch_id)
            .order_by(AiSeriesRegistry.id)
        )
        return list(result.scalars().all())

    # ------------------------------------------------------------------ #
    # Private helpers
    # ------------------------------------------------------------------ #

    async def _find(
        self, ingredient_id: str, branch_id: str
    ) -> AiSeriesRegistry | None:
        """Query theo (ingredient_id, branch_id) — dùng nội bộ."""
        result = await self.db.execute(
            select(AiSeriesRegistry).where(
                AiSeriesRegistry.ingredient_id == ingredient_id,
                AiSeriesRegistry.branch_id == branch_id,
            )
        )
        return result.scalar_one_or_none()
