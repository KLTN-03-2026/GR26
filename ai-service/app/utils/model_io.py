"""
Model I/O — lưu và load NeuralProphet model.

Dùng neuralprophet.save() / load() — KHÔNG dùng pickle.
Model lưu theo path: storage/models/{tenant_id}/global_model.np
"""

from pathlib import Path

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

MODEL_DIR = Path(settings.model_storage_dir)


def get_model_path(tenant_id: str) -> Path:
    """
    Trả về path file model của tenant.
    Format: storage/models/{tenant_id}/global_model.np
    """
    return MODEL_DIR / tenant_id / "global_model.np"


def save_model(model: object, tenant_id: str) -> Path:
    """
    Lưu NeuralProphet model vào storage.
    Tự tạo folder nếu chưa có. KHÔNG dùng pickle.

    Args:
        model: NeuralProphet instance đã train
        tenant_id: ID tenant — mỗi tenant có folder riêng

    Returns:
        Path file đã lưu
    """
    try:
        from neuralprophet import save  # type: ignore[import]
    except ImportError as exc:
        raise RuntimeError("NeuralProphet chưa được cài") from exc

    model_path = get_model_path(tenant_id)
    # Tạo thư mục tenant nếu chưa có
    model_path.parent.mkdir(parents=True, exist_ok=True)

    save(model, str(model_path))
    logger.info("Đã lưu model: %s", model_path)
    return model_path


def load_model(tenant_id: str) -> object:
    """
    Load NeuralProphet model từ storage.

    Args:
        tenant_id: ID tenant

    Returns:
        NeuralProphet instance đã train

    Raises:
        FileNotFoundError: Model chưa được train
    """
    try:
        from neuralprophet import load  # type: ignore[import]
    except ImportError as exc:
        raise RuntimeError("NeuralProphet chưa được cài") from exc

    model_path = get_model_path(tenant_id)
    if not model_path.exists():
        raise FileNotFoundError(
            f"Model chưa được train cho tenant {tenant_id!r}. "
            f"Chạy train job trước khi predict."
        )

    model = load(str(model_path))
    logger.info("Đã load model: %s", model_path)
    return model


def model_exists(tenant_id: str) -> bool:
    """Kiểm tra model đã được train hay chưa."""
    return get_model_path(tenant_id).exists()
