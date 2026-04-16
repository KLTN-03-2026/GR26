"""
Model I/O — lưu và load NeuralProphet model.

Dùng neuralprophet.save() / load() — KHÔNG dùng pickle.
Model lưu theo path: storage/models/{tenant_id}/global_model.np
Metadata train lưu cạnh file .np: train_metadata.json
"""

import json
from datetime import datetime, timezone
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


def _get_metadata_path(tenant_id: str) -> Path:
    """Trả về path file metadata JSON cạnh file model."""
    return MODEL_DIR / tenant_id / "train_metadata.json"


def save_model(model: object, tenant_id: str, series_count: int = 0) -> Path:
    """
    Lưu NeuralProphet model vào storage và ghi metadata train.

    Tự tạo folder nếu chưa có. KHÔNG dùng pickle — chỉ dùng neuralprophet.save().
    Ghi kèm train_metadata.json cạnh file .np để tra cứu sau.

    Args:
        model: NeuralProphet instance đã train xong
        tenant_id: ID tenant — mỗi tenant có folder riêng
        series_count: Số series đã train (dùng để log/monitor)

    Returns:
        Path của file .np đã lưu
    """
    try:
        from neuralprophet import save  # type: ignore[import]
    except ImportError as exc:
        raise RuntimeError("NeuralProphet chưa được cài") from exc

    model_path = get_model_path(tenant_id)
    # Tạo thư mục tenant nếu chưa có
    model_path.parent.mkdir(parents=True, exist_ok=True)

    # Lưu model bằng neuralprophet.save (không dùng pickle)
    save(model, str(model_path))
    logger.info("Đã lưu model: %s", model_path)

    # Ghi metadata train cạnh file model để theo dõi lịch sử
    metadata = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "tenant_id": tenant_id,
        "series_count": series_count,
        "model_path": str(model_path),
    }
    metadata_path = _get_metadata_path(tenant_id)
    metadata_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False))
    logger.info("Đã ghi metadata: %s", metadata_path)

    return model_path


def load_model(tenant_id: str) -> object | None:
    """
    Load NeuralProphet model từ storage.

    Trả về None thay vì raise exception để predict_service tự chuyển sang fallback.
    Nếu file tồn tại nhưng bị corrupt thực sự → log error + xóa file + return None.

    Dùng torch.load trực tiếp với weights_only=False thay vì neuralprophet.load()
    để tương thích với PyTorch 2.6+ (thay đổi default weights_only=True).

    Args:
        tenant_id: ID tenant

    Returns:
        NeuralProphet instance nếu load thành công, None nếu chưa có / lỗi
    """
    model_path = get_model_path(tenant_id)

    # File chưa tồn tại — tenant chưa được train
    if not model_path.exists():
        logger.debug("Model chưa có: tenant=%s", tenant_id)
        return None

    try:
        import torch  # type: ignore[import]

        # Dùng weights_only=False vì NeuralProphet lưu bằng pickle (torch.save toàn object)
        # PyTorch 2.6+ đổi default weights_only=True — phải override tường minh
        model = torch.load(str(model_path), map_location="cpu", weights_only=False)
        model.restore_trainer(accelerator=None)
        logger.info("Đã load model: %s", model_path)
        return model
    except Exception as exc:
        logger.error(
            "Load model thất bại (file corrupt): tenant=%s | %s → xóa file",
            tenant_id, exc,
        )
        # Xóa file hỏng để lần sau train lại từ đầu
        try:
            model_path.unlink(missing_ok=True)
            _get_metadata_path(tenant_id).unlink(missing_ok=True)
            logger.info("Đã xóa file hỏng: %s", model_path)
        except Exception as del_exc:
            logger.warning("Không xóa được file hỏng: %s", del_exc)
        return None


def model_exists(tenant_id: str) -> bool:
    """
    Kiểm tra model của tenant đã được train hay chưa.

    Chỉ kiểm tra sự tồn tại của file — không load vào bộ nhớ.

    Args:
        tenant_id: ID tenant

    Returns:
        True nếu file .np tồn tại, False nếu chưa
    """
    return get_model_path(tenant_id).exists()


def get_train_metadata(tenant_id: str) -> dict | None:
    """
    Đọc metadata lần train gần nhất của tenant.

    Args:
        tenant_id: ID tenant

    Returns:
        dict với các keys: trained_at, tenant_id, series_count, model_path
        None nếu chưa có file hoặc JSON bị lỗi
    """
    metadata_path = _get_metadata_path(tenant_id)

    if not metadata_path.exists():
        return None

    try:
        return json.loads(metadata_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning(
            "Đọc metadata thất bại: tenant=%s | %s", tenant_id, exc,
        )
        return None


def list_all_models() -> list[str]:
    """
    Liệt kê tất cả tenant_id đã có model file .np trong storage.

    Scan folder storage/models/ → tìm các subfolder có global_model.np.

    Returns:
        List tenant_id (có thể rỗng nếu chưa train lần nào)
    """
    if not MODEL_DIR.exists():
        return []

    result: list[str] = []
    for tenant_dir in MODEL_DIR.iterdir():
        if tenant_dir.is_dir() and (tenant_dir / "global_model.np").exists():
            result.append(tenant_dir.name)

    return sorted(result)
