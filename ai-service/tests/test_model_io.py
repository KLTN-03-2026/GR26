"""
Tests cho app/utils/model_io.py

Dùng tmp_path fixture của pytest để tạo thư mục tạm.
Mock neuralprophet.save / load để không cần cài NeuralProphet khi test.
Patch MODEL_DIR để trỏ vào thư mục tạm.
"""

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_np_file(model_dir: Path, tenant_id: str) -> Path:
    """Tạo file .np giả lập (empty) trong thư mục tạm."""
    tenant_dir = model_dir / tenant_id
    tenant_dir.mkdir(parents=True, exist_ok=True)
    np_file = tenant_dir / "global_model.np"
    np_file.write_bytes(b"fake model data")
    return np_file


def _make_metadata_file(model_dir: Path, tenant_id: str, data: dict | None = None) -> Path:
    """Tạo file train_metadata.json giả lập."""
    metadata = data or {
        "trained_at": "2026-04-15T02:00:00+00:00",
        "tenant_id": tenant_id,
        "series_count": 10,
        "model_path": f"{model_dir}/{tenant_id}/global_model.np",
    }
    meta_path = model_dir / tenant_id / "train_metadata.json"
    meta_path.write_text(json.dumps(metadata))
    return meta_path


# ---------------------------------------------------------------------------
# TestSaveModel
# ---------------------------------------------------------------------------

class TestSaveModel:
    """Tests cho save_model()."""

    def test_save_creates_np_file(self, tmp_path: Path) -> None:
        """save_model trả về đúng path file .np."""
        fake_model = MagicMock()
        with patch("neuralprophet.save"):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path

            result_path = model_io.save_model(fake_model, "tenant_a")

        # File path đúng
        expected = tmp_path / "tenant_a" / "global_model.np"
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
            model_io.save_model(fake_model, "tenant_a")

        mock_np_save.assert_called_once()

    def test_save_creates_metadata_json(self, tmp_path: Path) -> None:
        """save_model ghi train_metadata.json cạnh file .np."""
        fake_model = MagicMock()

        with (
            patch("app.utils.model_io.MODEL_DIR", tmp_path),
            patch("neuralprophet.save"),
        ):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path
            model_io.save_model(fake_model, "tenant_b", series_count=5)

        meta_path = tmp_path / "tenant_b" / "train_metadata.json"
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
            model_io.save_model(fake_model, "tenant_c")

        meta_path = tmp_path / "tenant_c" / "train_metadata.json"
        data = json.loads(meta_path.read_text())
        assert data["series_count"] == 0

    def test_save_creates_parent_dir(self, tmp_path: Path) -> None:
        """save_model tự tạo folder tenant nếu chưa có."""
        fake_model = MagicMock()
        new_tenant_dir = tmp_path / "brand_new_tenant"
        assert not new_tenant_dir.exists()

        with (
            patch("app.utils.model_io.MODEL_DIR", tmp_path),
            patch("neuralprophet.save"),
        ):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path
            model_io.save_model(fake_model, "brand_new_tenant")

        assert new_tenant_dir.exists()


# ---------------------------------------------------------------------------
# TestLoadModel
# ---------------------------------------------------------------------------

class TestLoadModel:
    """Tests cho load_model()."""

    def test_load_returns_none_when_file_missing(self, tmp_path: Path) -> None:
        """load_model trả về None khi file .np chưa tồn tại."""
        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        result = model_io.load_model("nonexistent_tenant")

        assert result is None

    def test_load_returns_model_on_success(self, tmp_path: Path) -> None:
        """load_model trả về model khi load thành công."""
        _make_np_file(tmp_path, "tenant_ok")
        fake_model = MagicMock(name="NeuralProphetInstance")

        with patch("neuralprophet.load", return_value=fake_model):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path

            result = model_io.load_model("tenant_ok")

        assert result is fake_model

    def test_load_corrupt_returns_none(self, tmp_path: Path) -> None:
        """load_model trả về None khi file bị corrupt (load exception)."""
        _make_np_file(tmp_path, "tenant_corrupt")

        with patch("neuralprophet.load", side_effect=RuntimeError("corrupt file")):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path

            result = model_io.load_model("tenant_corrupt")

        assert result is None

    def test_load_corrupt_deletes_np_file(self, tmp_path: Path) -> None:
        """load_model xóa file .np hỏng để tránh lần sau load lại."""
        np_file = _make_np_file(tmp_path, "tenant_del")
        assert np_file.exists()

        with patch("neuralprophet.load", side_effect=RuntimeError("bad file")):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path
            model_io.load_model("tenant_del")

        assert not np_file.exists(), "File .np hỏng phải bị xóa"

    def test_load_corrupt_deletes_metadata(self, tmp_path: Path) -> None:
        """load_model xóa cả metadata.json khi file model bị corrupt."""
        _make_np_file(tmp_path, "tenant_meta_del")
        meta_file = _make_metadata_file(tmp_path, "tenant_meta_del")
        assert meta_file.exists()

        with patch("neuralprophet.load", side_effect=RuntimeError("bad")):
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path
            model_io.load_model("tenant_meta_del")

        assert not meta_file.exists(), "metadata.json phải bị xóa cùng file model hỏng"


# ---------------------------------------------------------------------------
# TestModelExists
# ---------------------------------------------------------------------------

class TestModelExists:
    """Tests cho model_exists()."""

    def test_returns_true_when_file_exists(self, tmp_path: Path) -> None:
        """model_exists → True khi file .np tồn tại."""
        _make_np_file(tmp_path, "tenant_exists")

        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        assert model_io.model_exists("tenant_exists") is True

    def test_returns_false_when_file_missing(self, tmp_path: Path) -> None:
        """model_exists → False khi file chưa có."""
        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        assert model_io.model_exists("tenant_missing") is False

    def test_does_not_load_model(self, tmp_path: Path) -> None:
        """model_exists không load model vào bộ nhớ."""
        _make_np_file(tmp_path, "tenant_check")

        with patch("neuralprophet.load") as mock_load:
            import app.utils.model_io as model_io
            model_io.MODEL_DIR = tmp_path
            model_io.model_exists("tenant_check")

        mock_load.assert_not_called()


# ---------------------------------------------------------------------------
# TestGetTrainMetadata
# ---------------------------------------------------------------------------

class TestGetTrainMetadata:
    """Tests cho get_train_metadata()."""

    def test_returns_dict_when_file_exists(self, tmp_path: Path) -> None:
        """get_train_metadata trả về dict khi file tồn tại."""
        _make_np_file(tmp_path, "tenant_meta")
        _make_metadata_file(tmp_path, "tenant_meta", {
            "trained_at": "2026-04-15T02:00:00+00:00",
            "tenant_id": "tenant_meta",
            "series_count": 42,
            "model_path": "/some/path.np",
        })

        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        result = model_io.get_train_metadata("tenant_meta")

        assert result is not None
        assert result["series_count"] == 42
        assert result["tenant_id"] == "tenant_meta"

    def test_returns_none_when_file_missing(self, tmp_path: Path) -> None:
        """get_train_metadata trả về None khi chưa có metadata.json."""
        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        result = model_io.get_train_metadata("no_tenant")

        assert result is None

    def test_returns_none_on_invalid_json(self, tmp_path: Path) -> None:
        """get_train_metadata trả về None khi JSON bị lỗi."""
        tenant_dir = tmp_path / "bad_json_tenant"
        tenant_dir.mkdir(parents=True)
        (tenant_dir / "train_metadata.json").write_text("{ invalid json !!!}")

        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        result = model_io.get_train_metadata("bad_json_tenant")

        assert result is None


# ---------------------------------------------------------------------------
# TestListAllModels
# ---------------------------------------------------------------------------

class TestListAllModels:
    """Tests cho list_all_models()."""

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
        """list_all_models trả về danh sách tenant_id có model."""
        _make_np_file(tmp_path, "tenant_alpha")
        _make_np_file(tmp_path, "tenant_beta")

        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        result = model_io.list_all_models()

        assert sorted(result) == ["tenant_alpha", "tenant_beta"]

    def test_excludes_folders_without_np_file(self, tmp_path: Path) -> None:
        """list_all_models không liệt kê folder không có file .np."""
        # Folder có model
        _make_np_file(tmp_path, "tenant_with_model")
        # Folder không có model (chỉ có metadata)
        empty_tenant = tmp_path / "tenant_no_model"
        empty_tenant.mkdir()
        (empty_tenant / "train_metadata.json").write_text("{}")

        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        result = model_io.list_all_models()

        assert "tenant_with_model" in result
        assert "tenant_no_model" not in result

    def test_returns_sorted_list(self, tmp_path: Path) -> None:
        """list_all_models trả về danh sách đã sắp xếp alphabet."""
        _make_np_file(tmp_path, "zzz_tenant")
        _make_np_file(tmp_path, "aaa_tenant")
        _make_np_file(tmp_path, "mmm_tenant")

        import app.utils.model_io as model_io
        model_io.MODEL_DIR = tmp_path

        result = model_io.list_all_models()

        assert result == sorted(result)
