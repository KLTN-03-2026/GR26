"""
Model I/O — lưu và load NeuralProphet model per-branch.

Dùng neuralprophet.save() / load() — KHÔNG dùng pickle.
Model lưu theo path: storage/models/{tenant_id}/{branch_id}/model.np
Metadata train lưu cạnh file .np: train_metadata.json

Mỗi chi nhánh có folder riêng — tránh lẫn lộn model giữa các branch.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

MODEL_DIR = Path(settings.model_storage_dir)


def get_model_path(tenant_id: str, branch_id: str) -> Path:
    """
    Trả về path file model của chi nhánh.
    Format: storage/models/{tenant_id}/{branch_id}/model.np
    """
    return MODEL_DIR / tenant_id / branch_id / "model.np"


def _get_metadata_path(tenant_id: str, branch_id: str) -> Path:
    """Trả về path file metadata JSON trong folder branch."""
    return MODEL_DIR / tenant_id / branch_id / "train_metadata.json"


def save_model(
    model: object,
    tenant_id: str,
    branch_id: str,
    series_count: int = 0,
    mae: float | None = None,
    mape: float | None = None,
    config: dict | None = None,
) -> Path:
    """
    Lưu NeuralProphet model vào storage và ghi metadata train.

    Tự tạo folder nếu chưa có. KHÔNG dùng pickle — chỉ dùng neuralprophet.save().
    Ghi kèm train_metadata.json cạnh file .np để tra cứu và validate sau.

    Args:
        model: NeuralProphet instance đã train xong
        tenant_id: ID tenant — mỗi tenant có folder riêng
        branch_id: ID chi nhánh — mỗi branch có subfolder riêng
        series_count: Số ingredient series đã train
        mae: MAE cuối epoch từ NeuralProphet metrics
        mape: MAPE % tính từ in-sample predictions
        config: Dict config NeuralProphet đã dùng khi train (để validate lúc predict)

    Returns:
        Path của file .np đã lưu
    """
    try:
        from neuralprophet import save  # type: ignore[import]
    except ImportError as exc:
        raise RuntimeError("NeuralProphet chưa được cài") from exc

    model_path = get_model_path(tenant_id, branch_id)
    # Tạo thư mục branch nếu chưa có
    model_path.parent.mkdir(parents=True, exist_ok=True)

    # Lưu model bằng neuralprophet.save (không dùng pickle)
    save(model, str(model_path))
    logger.info("Đã lưu model: %s", model_path)

    # Ghi metadata train để theo dõi lịch sử và validate config khi predict
    metadata: dict = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "series_count": series_count,
        "mae": mae,
        "mape": mape,
        "model_path": str(model_path),
        "config": config or {},
    }
    metadata_path = _get_metadata_path(tenant_id, branch_id)
    metadata_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False, default=str))
    logger.info("Đã ghi metadata: %s", metadata_path)

    return model_path


def load_model(tenant_id: str, branch_id: str) -> object | None:
    """
    Load NeuralProphet model của chi nhánh từ storage.

    Trả về None thay vì raise exception — predict_service tự xử lý fallback.
    Nếu file tồn tại nhưng bị corrupt → log error + xóa file + return None.

    Dùng torch.load trực tiếp với weights_only=False để tương thích PyTorch 2.6+.

    Args:
        tenant_id: ID tenant
        branch_id: ID chi nhánh

    Returns:
        NeuralProphet instance nếu load thành công, None nếu chưa có / lỗi
    """
    model_path = get_model_path(tenant_id, branch_id)

    # File chưa tồn tại — branch chưa được train
    if not model_path.exists():
        logger.debug("Model chưa có: tenant=%s branch=%s", tenant_id, branch_id)
        return None

    try:
        import torch  # type: ignore[import]

        # weights_only=False vì NeuralProphet lưu bằng pickle (torch.save toàn object)
        # PyTorch 2.6+ đổi default weights_only=True — phải override tường minh
        model = torch.load(str(model_path), map_location="cpu", weights_only=False)
        model.restore_trainer(accelerator=None)
        logger.info("Đã load model: %s", model_path)
        return model
    except Exception as exc:
        logger.error(
            "Load model thất bại (file corrupt): tenant=%s branch=%s | %s → xóa file",
            tenant_id, branch_id, exc,
        )
        # Xóa file hỏng để lần train sau tạo lại từ đầu
        try:
            model_path.unlink(missing_ok=True)
            _get_metadata_path(tenant_id, branch_id).unlink(missing_ok=True)
            logger.info("Đã xóa file hỏng: %s", model_path)
        except Exception as del_exc:
            logger.warning("Không xóa được file hỏng: %s", del_exc)
        return None


def model_exists(tenant_id: str, branch_id: str) -> bool:
    """
    Kiểm tra model của chi nhánh đã được train hay chưa.

    Chỉ kiểm tra sự tồn tại của file — không load vào bộ nhớ.

    Args:
        tenant_id: ID tenant
        branch_id: ID chi nhánh

    Returns:
        True nếu file .np tồn tại, False nếu chưa
    """
    return get_model_path(tenant_id, branch_id).exists()


def get_train_metadata(tenant_id: str, branch_id: str) -> dict | None:
    """
    Đọc metadata lần train gần nhất của chi nhánh.

    Args:
        tenant_id: ID tenant
        branch_id: ID chi nhánh

    Returns:
        dict với keys: trained_at, tenant_id, branch_id, series_count, mae, mape, model_path, config
        None nếu chưa có file hoặc JSON bị lỗi
    """
    metadata_path = _get_metadata_path(tenant_id, branch_id)

    if not metadata_path.exists():
        return None

    try:
        return json.loads(metadata_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning(
            "Đọc metadata thất bại: tenant=%s branch=%s | %s",
            tenant_id, branch_id, exc,
        )
        return None


def get_model_config(tenant_id: str, branch_id: str) -> dict | None:
    """
    Đọc config NeuralProphet đã dùng khi train model của chi nhánh.

    Dùng trong predict_service để validate config model khớp với config hiện tại.
    Nếu n_forecasts lúc train ≠ n_forecasts hiện tại → cần retrain.

    Args:
        tenant_id: ID tenant
        branch_id: ID chi nhánh

    Returns:
        dict config (n_lags, n_forecasts, epochs, weekly_seasonality, yearly_seasonality)
        None nếu chưa có metadata
    """
    metadata = get_train_metadata(tenant_id, branch_id)
    if metadata is None:
        return None
    return metadata.get("config") or None


def list_all_models() -> list[dict]:
    """
    Liệt kê tất cả model đã train trong storage.

    Scan storage/models/{tenant_id}/{branch_id}/model.np

    Returns:
        List[dict] với keys: tenant_id (str), branch_id (str)
        Trả về list rỗng nếu chưa train lần nào
    """
    if not MODEL_DIR.exists():
        return []

    results: list[dict] = []
    for tenant_dir in MODEL_DIR.iterdir():
        if not tenant_dir.is_dir():
            continue
        for branch_dir in tenant_dir.iterdir():
            if branch_dir.is_dir() and (branch_dir / "model.np").exists():
                results.append({
                    "tenant_id": tenant_dir.name,
                    "branch_id": branch_dir.name,
                })

    return sorted(results, key=lambda x: (x["tenant_id"], x["branch_id"]))
