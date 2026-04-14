"""
AiSeriesRegistry — bảng ánh xạ (ingredient_id × branch_id) → integer series_id.

Mục đích:
- NeuralProphet Global Model cần ID dạng string ngắn, ổn định cho mỗi series
- Thay vì dùng UUID dài, ta map sang integer rồi format "s{id}" (e.g. "s42")
- Mỗi cặp (ingredient × branch) chỉ có 1 record — UNIQUE constraint đảm bảo điều này

UUID ingredient_id, branch_id đến từ Spring Boot BE — lưu tham chiếu, không FK ngoại
vì AI Service dùng schema riêng quản lý bởi Alembic.
"""

from datetime import datetime

from sqlalchemy import DateTime, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AiSeriesRegistry(Base):
    """Bảng registry ánh xạ (ingredient_id × branch_id) → integer series_id."""

    __tablename__ = "ai_series_registry"
    __table_args__ = (
        UniqueConstraint("ingredient_id", "branch_id", name="uq_series_ing_branch"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # UUID từ BE — lưu tham chiếu, không có FK ngoại (cross-schema)
    ingredient_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), nullable=False, index=True
    )
    branch_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), nullable=False, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    @property
    def series_id(self) -> str:
        """
        ID dạng string dùng trong NeuralProphet Global Model.
        Format: "s{id}" — e.g. id=42 → "s42"
        """
        return f"s{self.id}"
