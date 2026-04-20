"""
Tests cho app/core/security.py — verify_token + TokenPayload.

Dùng mock để không cần JWT token thật hoặc kết nối DB.
"""

import pytest
from fastapi import HTTPException
from jose import JWTError
from unittest.mock import patch


class TestVerifyToken:
    """Tests cho hàm verify_token()."""

    def test_valid_token_returns_payload(self) -> None:
        """Token hợp lệ → TokenPayload với đúng fields."""
        fake_payload = {
            "sub": "user-uuid-001",
            "tenantId": "tenant-uuid-001",
            "role": "OWNER",
            "branchId": "branch-uuid-001",
            "permissions": ["FORECAST_READ", "TRAIN_TRIGGER"],
        }

        with patch("app.core.security.jwt.decode", return_value=fake_payload):
            from app.core.security import verify_token

            result = verify_token("any_token_string")

        assert result.user_id == "user-uuid-001"
        assert result.tenant_id == "tenant-uuid-001"
        assert result.role == "OWNER"
        assert result.branch_id == "branch-uuid-001"
        assert result.permissions == ["FORECAST_READ", "TRAIN_TRIGGER"]

    def test_valid_token_with_permissions(self) -> None:
        """permissions list được map đúng từ payload."""
        fake_payload = {
            "sub": "u1",
            "tenantId": "t1",
            "role": "ADMIN",
            "permissions": ["READ", "WRITE", "DELETE"],
        }

        with patch("app.core.security.jwt.decode", return_value=fake_payload):
            from app.core.security import verify_token

            result = verify_token("tok")

        assert result.permissions == ["READ", "WRITE", "DELETE"]

    def test_tenant_id_camelcase(self) -> None:
        """tenantId (camelCase) được nhận diện đúng."""
        fake_payload = {"sub": "u1", "tenantId": "tenant-camel", "role": "OWNER"}

        with patch("app.core.security.jwt.decode", return_value=fake_payload):
            from app.core.security import verify_token

            result = verify_token("tok")

        assert result.tenant_id == "tenant-camel"

    def test_tenant_id_snake_case_fallback(self) -> None:
        """tenant_id (snake_case) hoạt động khi không có tenantId."""
        fake_payload = {"sub": "u1", "tenant_id": "tenant-snake", "role": "OWNER"}

        with patch("app.core.security.jwt.decode", return_value=fake_payload):
            from app.core.security import verify_token

            result = verify_token("tok")

        assert result.tenant_id == "tenant-snake"

    def test_branch_id_none_when_missing(self) -> None:
        """branch_id là None khi không có trong payload."""
        fake_payload = {"sub": "u1", "tenantId": "t1", "role": "OWNER"}

        with patch("app.core.security.jwt.decode", return_value=fake_payload):
            from app.core.security import verify_token

            result = verify_token("tok")

        assert result.branch_id is None

    def test_permissions_default_empty_list(self) -> None:
        """permissions là [] khi không có trong payload."""
        fake_payload = {"sub": "u1", "tenantId": "t1", "role": "OWNER"}

        with patch("app.core.security.jwt.decode", return_value=fake_payload):
            from app.core.security import verify_token

            result = verify_token("tok")

        assert result.permissions == []

    def test_expired_token_raises_401(self) -> None:
        """Token hết hạn (JWTError) → HTTPException 401."""
        with patch(
            "app.core.security.jwt.decode",
            side_effect=JWTError("Signature has expired"),
        ):
            from app.core.security import verify_token

            with pytest.raises(HTTPException) as exc_info:
                verify_token("expired_token")

        assert exc_info.value.status_code == 401
        assert "hết hạn" in exc_info.value.detail.lower() or "hợp lệ" in exc_info.value.detail.lower()

    def test_wrong_secret_raises_401(self) -> None:
        """Token sai secret → JWTError → HTTPException 401."""
        with patch(
            "app.core.security.jwt.decode",
            side_effect=JWTError("Signature verification failed"),
        ):
            from app.core.security import verify_token

            with pytest.raises(HTTPException) as exc_info:
                verify_token("bad_signature_token")

        assert exc_info.value.status_code == 401

    def test_missing_tenant_id_raises_403(self) -> None:
        """Payload không có tenantId/tenant_id → HTTPException 403."""
        fake_payload = {"sub": "u1", "role": "OWNER"}  # không có tenantId

        with patch("app.core.security.jwt.decode", return_value=fake_payload):
            from app.core.security import verify_token

            with pytest.raises(HTTPException) as exc_info:
                verify_token("tok_no_tenant")

        assert exc_info.value.status_code == 403
        assert "tenant_id" in exc_info.value.detail.lower()

    def test_missing_sub_raises_401(self) -> None:
        """Payload không có sub (userId) → HTTPException 401."""
        fake_payload = {"tenantId": "t1", "role": "OWNER"}  # không có sub

        with patch("app.core.security.jwt.decode", return_value=fake_payload):
            from app.core.security import verify_token

            with pytest.raises(HTTPException) as exc_info:
                verify_token("tok_no_sub")

        assert exc_info.value.status_code == 401

    def test_role_defaults_to_empty_string(self) -> None:
        """role không có trong payload → default là chuỗi rỗng."""
        fake_payload = {"sub": "u1", "tenantId": "t1"}

        with patch("app.core.security.jwt.decode", return_value=fake_payload):
            from app.core.security import verify_token

            result = verify_token("tok")

        assert result.role == ""
