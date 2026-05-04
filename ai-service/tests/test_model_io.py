"""
Tests cho app/utils/model_io.py

Dùng tmp_path fixture của pytest để tạo thư mục tạm.
Mock neuralprophet.save / torch.load để không cần load model thật khi test.
Patch MODEL_DIR để trỏ vào thư mục tạm.

Lưu ý: model_io đã refactor sang per-branch path (migration 003):
  storage/models/{tenant_id}/{branch_id}/model.np
Mọi hàm đều nhận thêm tham số branch_id.
"""

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_np_file(model_dir: Path, tenant_id: str, branch_id: str = "branch_test") -> Path:
    """Tạo file .np giả lập (empty) trong thư mục tạm theo per-branch path."""
    branch_dir = model_dir / tenant_id / branch_id
    branch_dir.mkdir(parents=True, exist_ok=True)
    np_file = branch_dir / "model.np"
    np_file.write_bytes(b"fake model data")
    return np_file


def _make_metadata_file(
    model_dir: Path,
    tenant_id: str,
    branch_id: str = "branch_test",
    data: dict | None = None,
) -> Path:
    """Tạo file train_metadata.json giả lập trong thư mục tạm."""
    metadata = data or {
        "trained_at": "2026-04-15T02:00:00+00:00",
        "tenant_id": tenant_id,
        "branch_id": branch_id,
        "series_count": 10,
        "model_path": f"{model_dir}/{tenant_id}/{branch_id}/model.np",
    }
    meta_path = model_dir / tenant_id / branch_id / "train_metadata.json"
    meta_path.parent.mkdir(parents=True, exist_ok=True)
    meta_path.write_text(json.dumps(metadata))
    return meta_path


# ---------------------------------------------------------------------------
# TestSaveModel
# ---------------------------------------------------------------------------

class TestSaveModel:
    """Tests cho save_model()."""

    def test_save_creates_np_file(self, tmp_path: Path) -> None:
        """save_model trả về đúng path file .np theo per-branch format."""
        fake_model = MagicMock()
        with patch("neuralprophet.save"):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path

            result_path = model_io.save_model(fake_model, "tenant_a", "branch_test")

        # Path format mới: {tenant_id}/{branch_id}/model_{type}.np
        expected = tmp_path / "tenant_a" / "branch_test" / "model_daily.np"
        assert result_path == expected

    def test_save_calls_neuralprophet_save(self, tmp_path: Path) -> None:
        """save_model gọi neuralprophet.save (không dùng pickle)."""
        fake_model = MagicMock()

        with (
            patch("app.utils.model_io.MODEL_DIR", tmp_path),
            patch("neuralprophet.save") as mock_np_save,
        ):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path
            model_io.save_model(fake_model, "tenant_a", "branch_test")

        mock_np_save.assert_called_once()

    def test_save_creates_metadata_json(self, tmp_path: Path) -> None:
        """save_model ghi train_metadata.json cạnh file .np trong folder branch."""
        fake_model = MagicMock()

        with (
            patch("app.utils.model_io.MODEL_DIR", tmp_path),
            patch("neuralprophet.save"),
        ):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path
            model_io.save_model(fake_model, "tenant_b", "branch_test", series_count=5)

        meta_path = tmp_path / "tenant_b" / "branch_test" / "train_metadata.json"
        assert meta_path.exists(), "train_metadata.json phải tồn tại"

        data = json.loads(meta_path.read_text())
        assert data["tenant_id"] == "tenant_b"
        assert data["series_count"] == 5
        assert "trained_at" in data
        assert "model_path" in data

    def test_save_metadata_default_series_count_zero(self, tmp_path: Path) -> None:
        """series_count mặc định là 0 nếu không truyền."""
        fake_model = MagicMock()

        with (
            patch("app.utils.model_io.MODEL_DIR", tmp_path),
            patch("neuralprophet.save"),
        ):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path
            model_io.save_model(fake_model, "tenant_c", "branch_test")

        meta_path = tmp_path / "tenant_c" / "branch_test" / "train_metadata.json"
        data = json.loads(meta_path.read_text())
        assert data["series_count"] == 0

    def test_save_creates_parent_dir(self, tmp_path: Path) -> None:
        """save_model tự tạo folder tenant/branch nếu chưa có."""
        fake_model = MagicMock()
        new_branch_dir = tmp_path / "brand_new_tenant" / "branch_test"
        assert not new_branch_dir.exists()

        with (
            patch("app.utils.model_io.MODEL_DIR", tmp_path),
            patch("neuralprophet.save"),
        ):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path
            model_io.save_model(fake_model, "brand_new_tenant", "branch_test")

        assert new_branch_dir.exists()


# ---------------------------------------------------------------------------
# TestLoadModel
# ---------------------------------------------------------------------------

class TestLoadModel:
    """Tests cho load_model()."""

    def test_load_returns_none_when_file_missing(self, tmp_path: Path) -> None:
        """load_model trả về None khi file .np chưa tồn tại."""
        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        result = model_io.load_model("nonexistent_tenant", "branch_test")

        assert result is None

    def test_load_returns_model_on_success(self, tmp_path: Path) -> None:
        """load_model trả về model khi load thành công."""
        _make_np_file(tmp_path, "tenant_ok", "branch_test")
        fake_model = MagicMock(name="NeuralProphetInstance")

        with patch("torch.load", return_value=fake_model):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path

            result = model_io.load_model("tenant_ok", "branch_test")

        assert result is fake_model
        fake_model.restore_trainer.assert_called_once_with(accelerator=None)

    def test_load_corrupt_returns_none(self, tmp_path: Path) -> None:
        """load_model trả về None khi file bị corrupt (load exception)."""
        _make_np_file(tmp_path, "tenant_corrupt", "branch_test")

        with patch("torch.load", side_effect=RuntimeError("corrupt file")):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path

            result = model_io.load_model("tenant_corrupt", "branch_test")

        assert result is None

    def test_load_corrupt_deletes_np_file(self, tmp_path: Path) -> None:
        """load_model xóa file .np hỏng để tránh lần sau load lại."""
        np_file = _make_np_file(tmp_path, "tenant_del", "branch_test")
        assert np_file.exists()

        with patch("torch.load", side_effect=RuntimeError("bad file")):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path
            model_io.load_model("tenant_del", "branch_test")

        assert not np_file.exists(), "File .np hỏng phải bị xóa"

    def test_load_corrupt_deletes_metadata(self, tmp_path: Path) -> None:
        """load_model xóa cả metadata.json khi file model bị corrupt."""
        _make_np_file(tmp_path, "tenant_meta_del", "branch_test")
        meta_file = _make_metadata_file(tmp_path, "tenant_meta_del", "branch_test")
        assert meta_file.exists()

        with patch("torch.load", side_effect=RuntimeError("bad")):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path
            model_io.load_model("tenant_meta_del", "branch_test")

        assert not meta_file.exists(), "metadata.json phải bị xóa cùng file model hỏng"


# ---------------------------------------------------------------------------
# TestModelExists
# ---------------------------------------------------------------------------

class TestModelExists:
    """Tests cho model_exists()."""

    def test_returns_true_when_file_exists(self, tmp_path: Path) -> None:
        """model_exists → True khi file .np tồn tại."""
        _make_np_file(tmp_path, "tenant_exists", "branch_test")

        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        assert model_io.model_exists("tenant_exists", "branch_test") is True

    def test_returns_false_when_file_missing(self, tmp_path: Path) -> None:
        """model_exists → False khi file chưa có."""
        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        assert model_io.model_exists("tenant_missing", "branch_test") is False

    def test_does_not_load_model(self, tmp_path: Path) -> None:
        """model_exists không load model vào bộ nhớ."""
        _make_np_file(tmp_path, "tenant_check", "branch_test")

        with patch("torch.load") as mock_load:
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path
            model_io.model_exists("tenant_check", "branch_test")

        mock_load.assert_not_called()


# ---------------------------------------------------------------------------
# TestGetTrainMetadata
# ---------------------------------------------------------------------------

class TestGetTrainMetadata:
    """Tests cho get_train_metadata()."""

    def test_returns_dict_when_file_exists(self, tmp_path: Path) -> None:
        """get_train_metadata trả về dict khi file tồn tại."""
        _make_np_file(tmp_path, "tenant_meta", "branch_test")
        _make_metadata_file(tmp_path, "tenant_meta", "branch_test", {
            "trained_at": "2026-04-15T02:00:00+00:00",
            "tenant_id": "tenant_meta",
            "series_count": 42,
            "model_path": "/some/path.np",
        })

        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        result = model_io.get_train_metadata("tenant_meta", "branch_test")

        assert result is not None
        assert result["series_count"] == 42
        assert result["tenant_id"] == "tenant_meta"

    def test_returns_none_when_file_missing(self, tmp_path: Path) -> None:
        """get_train_metadata trả về None khi chưa có metadata.json."""
        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        result = model_io.get_train_metadata("no_tenant", "branch_test")

        assert result is None

    def test_returns_none_on_invalid_json(self, tmp_path: Path) -> None:
        """get_train_metadata trả về None khi JSON bị lỗi."""
        branch_dir = tmp_path / "bad_json_tenant" / "branch_test"
        branch_dir.mkdir(parents=True)
        (branch_dir / "train_metadata.json").write_text("{ invalid json !!!}")

        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        result = model_io.get_train_metadata("bad_json_tenant", "branch_test")

        assert result is None


# ---------------------------------------------------------------------------
# TestListAllModels
# ---------------------------------------------------------------------------

class TestListAllModels:
    """Tests cho list_all_models().

    Lưu ý: list_all_models() trả về list[dict] với keys 'tenant_id' và 'branch_id',
    không còn trả về list[str] nữa (per-branch path refactor).
    """

    def test_returns_empty_when_storage_missing(self, tmp_path: Path) -> None:
        """list_all_models trả về [] khi storage dir chưa tồn tại."""
        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path / "nonexistent_storage"

        result = model_io.list_all_models()

        assert result == []

    def test_returns_empty_when_no_models(self, tmp_path: Path) -> None:
        """list_all_models trả về [] khi chưa có model nào."""
        tmp_path.mkdir(exist_ok=True)  # storage tồn tại nhưng rỗng

        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        result = model_io.list_all_models()

        assert result == []

    def test_returns_tenant_ids(self, tmp_path: Path) -> None:
        """list_all_models trả về danh sách dict tenant_id/branch_id có model."""
        _make_np_file(tmp_path, "tenant_alpha", "branch_test")
        _make_np_file(tmp_path, "tenant_beta", "branch_test")

        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        result = model_io.list_all_models()

        # Kết quả là list[dict] — lấy tenant_ids để kiểm tra
        tenant_ids = [r["tenant_id"] for r in result]
        assert sorted(tenant_ids) == ["tenant_alpha", "tenant_beta"]

    def test_excludes_folders_without_np_file(self, tmp_path: Path) -> None:
        """list_all_models không liệt kê folder không có file model.np."""
        # Folder có model
        _make_np_file(tmp_path, "tenant_with_model", "branch_test")
        # Folder không có model (chỉ có metadata ở root tenant, không có branch subdir)
        empty_tenant = tmp_path / "tenant_no_model"
        empty_tenant.mkdir()
        (empty_tenant / "train_metadata.json").write_text("{}")  # file không phải dir

        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        result = model_io.list_all_models()

        tenant_ids = [r["tenant_id"] for r in result]
        assert "tenant_with_model" in tenant_ids
        assert "tenant_no_model" not in tenant_ids

    def test_returns_sorted_list(self, tmp_path: Path) -> None:
        """list_all_models trả về danh sách đã sắp xếp theo (tenant_id, branch_id)."""
        _make_np_file(tmp_path, "zzz_tenant", "branch_test")
        _make_np_file(tmp_path, "aaa_tenant", "branch_test")
        _make_np_file(tmp_path, "mmm_tenant", "branch_test")

        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        result = model_io.list_all_models()

        # Kết quả đã sắp xếp theo (tenant_id, branch_id)
        assert result == sorted(result, key=lambda x: (x["tenant_id"], x["branch_id"]))
