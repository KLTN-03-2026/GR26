"""
Xác thực JWT token phát hành bởi Spring Boot.

Claim names từ JwtService.java của BE:
- sub       : userId (UUID string)
- tenantId  : UUID tenant (camelCase)
- branchId  : UUID chi nhánh đang làm việc (camelCase, có thể null)
- role      : vai trò (OWNER | CASHIER | BARISTA | WAITER...)
- permissions: List[str]

Algorithm: HMAC-SHA256 (HS256) — secret dùng chung với Spring Boot.
"""

from dataclasses import dataclass

from jose import JWTError, jwt

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class TokenPayload:
    """Payload sau khi decode JWT từ Spring Boot."""

    user_id: str      # sub claim
    tenant_id: str    # tenantId claim
    role: str         # role claim
    branch_id: str | None = None  # branchId claim — None nếu chưa chọn chi nhánh


def verify_token(token: str) -> TokenPayload:
    """
    Verify JWT token và trả về payload.
    Raise ValueError nếu token không hợp lệ hoặc hết hạn.

    Args:
        token: Bearer token (không bao gồm prefix "Bearer ")

    Returns:
        TokenPayload với user_id, tenant_id, role, branch_id

    Raises:
        ValueError: Token không hợp lệ, hết hạn, hoặc thiếu claims
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        logger.warning("JWT verify thất bại: %s", exc)
        raise ValueError(f"Token không hợp lệ: {exc}") from exc

    # Lấy claims — dùng đúng tên camelCase như JwtService.java
    user_id: str | None = payload.get("sub")
    tenant_id: str | None = payload.get("tenantId")
    role: str | None = payload.get("role")
    branch_id: str | None = payload.get("branchId")  # Nullable

    if not user_id:
        raise ValueError("Token thiếu claim 'sub' (userId)")
    if not tenant_id:
        raise ValueError("Token thiếu claim 'tenantId'")
    if not role:
        raise ValueError("Token thiếu claim 'role'")

    return TokenPayload(
        user_id=user_id,
        tenant_id=tenant_id,
        role=role,
        branch_id=branch_id,
    )
