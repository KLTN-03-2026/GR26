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


def get_model_path(tenant_id: str, branch_id: str, model_type: str = "daily") -> Path:
    """
    Trả về path file model của chi nhánh.

    Format mới: storage/models/{tenant_id}/{branch_id}/model_{type}.np
    - model_type="daily"  → model_daily.np  (regular series — daily freq)
    - model_type="weekly" → model_weekly.np (intermittent/sparse — weekly freq)
    - model_type="legacy" → model.np        (backward compat với model cũ)

    Args:
        tenant_id: ID tenant
        branch_id: ID chi nhánh
        model_type: Loại model — "daily", "weekly", hoặc "legacy"

    Returns:
        Path tới file .np tương ứng
    """
    if model_type == "legacy":
        return MODEL_DIR / tenant_id / branch_id / "model.np"
    return MODEL_DIR / tenant_id / branch_id / f"model_{model_type}.np"


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
    model_type: str = "daily",
    extra_metadata: dict | None = None,
) -> Path:
    """
    Lưu NeuralProphet model vào storage và cập nhật metadata train.

    Tự tạo folder nếu chưa có. KHÔNG dùng pickle — chỉ dùng neuralprophet.save().
    Metadata được MERGE (không ghi đè) để hỗ trợ lưu nhiều loại model
    (daily + weekly) cùng một branch mà không mất thông tin lẫn nhau.

    Args:
        model: NeuralProphet instance đã train xong
        tenant_id: ID tenant — mỗi tenant có folder riêng
        branch_id: ID chi nhánh — mỗi branch có subfolder riêng
        series_count: Số ingredient series đã train
        mae: MAE cuối epoch từ NeuralProphet metrics
        mape: MAPE % tính từ in-sample predictions
        config: Dict config NeuralProphet đã dùng khi train (để validate lúc predict)
        model_type: "daily" (default), "weekly" — xác định tên file .np
        extra_metadata: Dict bổ sung merge vào metadata (vd: series_classification)

    Returns:
        Path của file .np đã lưu
    """
    try:
        from neuralprophet import save  # type: ignore[import]
    except ImportError as exc:
        raise RuntimeError("NeuralProphet chưa được cài") from exc

    model_path = get_model_path(tenant_id, branch_id, model_type)
    # Tạo thư mục branch nếu chưa có
    model_path.parent.mkdir(parents=True, exist_ok=True)

    # Lưu model bằng neuralprophet.save (không dùng pickle)
    save(model, str(model_path))
    logger.info("Đã lưu model: %s", model_path)

    # Đọc metadata hiện tại (nếu có) để MERGE — không ghi đè khi lưu model thứ 2
    metadata_path = _get_metadata_path(tenant_id, branch_id)
    existing: dict = {}
    if metadata_path.exists():
        try:
            existing = json.loads(metadata_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            existing = {}

    # Cập nhật trường chung (trained_at, series_count)
    existing.update({
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "series_count": existing.get("series_count", 0) + series_count,
    })

    # Lưu mae/mape và config theo model_type để không ghi đè lẫn nhau
    existing.setdefault("metrics", {})[model_type] = {"mae": mae, "mape": mape}
    existing.setdefault("configs", {})[model_type] = config or {}
    existing.setdefault("model_paths", {})[model_type] = str(model_path)

    # Backward-compat: giữ trường "config" = config của daily model
    if model_type == "daily":
        existing["config"] = config or {}
        existing["mae"] = mae
        existing["mape"] = mape
        existing["model_path"] = str(model_path)

    # Merge extra_metadata (vd: series_classification)
    if extra_metadata:
        existing.update(extra_metadata)

    metadata_path.write_text(json.dumps(existing, indent=2, ensure_ascii=False, default=str))
    logger.info("Đã cập nhật metadata: %s (model_type=%s)", metadata_path, model_type)

    return model_path


def load_model(tenant_id: str, branch_id: str, model_type: str = "daily") -> object | None:
    """
    Load NeuralProphet model của chi nhánh từ storage.

    Trả về None thay vì raise exception — predict_service tự xử lý fallback.
    Nếu file tồn tại nhưng bị corrupt → log error + xóa file + return None.

    Backward compat: nếu model_type="daily" và model_daily.np không tồn tại,
    tự động thử load model.np (format cũ trước khi có weekly split).

    Dùng torch.load trực tiếp với weights_only=False để tương thích PyTorch 2.6+.

    Args:
        tenant_id: ID tenant
        branch_id: ID chi nhánh
        model_type: "daily" (default) hoặc "weekly"

    Returns:
        NeuralProphet instance nếu load thành công, None nếu chưa có / lỗi
    """
    model_path = get_model_path(tenant_id, branch_id, model_type)

    # Backward compat: nếu model_daily.np chưa có, thử model.np (model cũ)
    if not model_path.exists() and model_type == "daily":
        legacy_path = get_model_path(tenant_id, branch_id, "legacy")
        if legacy_path.exists():
            logger.info(
                "model_daily.np chưa có, dùng model.np legacy: tenant=%s branch=%s",
                tenant_id, branch_id,
            )
            model_path = legacy_path
        else:
            logger.debug("Model chưa có: tenant=%s branch=%s type=%s", tenant_id, branch_id, model_type)
            return None

    # File chưa tồn tại — chưa được train (cho model_type khác daily)
    if not model_path.exists():
        logger.debug("Model chưa có: tenant=%s branch=%s type=%s", tenant_id, branch_id, model_type)
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
    Chấp nhận cả format mới (model_daily.np) lẫn format cũ (model.np).

    Args:
        tenant_id: ID tenant
        branch_id: ID chi nhánh

    Returns:
        True nếu ít nhất 1 model file tồn tại, False nếu chưa train
    """
    return (
        get_model_path(tenant_id, branch_id, "daily").exists()
        or get_model_path(tenant_id, branch_id, "legacy").exists()
    )


def update_train_metadata(
    tenant_id: str,
    branch_id: str,
    updates: dict,
) -> None:
    """
    Cập nhật (merge) một số trường vào train_metadata.json mà không ghi đè toàn bộ.

    Dùng sau khi train để thêm series_classification, model_paths v.v.
    Nếu file chưa tồn tại thì tạo mới với các trường trong updates.

    Args:
        tenant_id: ID tenant
        branch_id: ID chi nhánh
        updates: Dict các trường cần thêm/cập nhật
    """
    metadata_path = _get_metadata_path(tenant_id, branch_id)
    existing: dict = {}
    if metadata_path.exists():
        try:
            existing = json.loads(metadata_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            existing = {}

    existing.update(updates)
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.write_text(json.dumps(existing, indent=2, ensure_ascii=False, default=str))
    logger.debug("update_train_metadata: tenant=%s branch=%s | keys=%s", tenant_id, branch_id, list(updates.keys()))


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
            # Nhận diện cả format mới (model_daily.np) lẫn cũ (model.np)
            has_model = (
                (branch_dir / "model_daily.np").exists()
                or (branch_dir / "model.np").exists()
            )
            if branch_dir.is_dir() and has_model:
                results.append({
                    "tenant_id": tenant_dir.name,
                    "branch_id": branch_dir.name,
                })

    return sorted(results, key=lambda x: (x["tenant_id"], x["branch_id"]))
