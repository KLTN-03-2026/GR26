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

from dataclasses import dataclass, field

from fastapi import HTTPException, status
from jose import JWTError, jwt

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class TokenPayload:
    """Payload sau khi decode JWT từ Spring Boot."""

    user_id: str                    # sub claim
    tenant_id: str                  # tenantId claim
    role: str                       # role claim
    branch_id: str | None = None    # branchId claim — None nếu chưa chọn chi nhánh
    permissions: list[str] = field(default_factory=list)  # danh sách quyền


def verify_token(token: str) -> TokenPayload:
    """
    Verify JWT token và trả về payload.
    Raise HTTPException thay vì ValueError để FastAPI xử lý trực tiếp.

    Args:
        token: Bearer token (không bao gồm prefix "Bearer ")

    Returns:
        TokenPayload với user_id, tenant_id, role, branch_id, permissions

    Raises:
        HTTPException 401: Token không hợp lệ hoặc đã hết hạn
        HTTPException 403: Token thiếu tenant_id (không được phép truy cập)
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        logger.warning("JWT verify thất bại: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc đã hết hạn",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    # Lấy claims — hỗ trợ cả camelCase (Spring Boot) và snake_case
    user_id: str | None = payload.get("sub")
    tenant_id: str | None = payload.get("tenantId") or payload.get("tenant_id")
    role: str | None = payload.get("role", "")
    branch_id: str | None = payload.get("branchId") or payload.get("branch_id")
    permissions: list[str] = payload.get("permissions") or []

    # sub là claim bắt buộc của JWT — thiếu là token không hợp lệ
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ: thiếu claim 'sub'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # tenant_id bắt buộc — thiếu nghĩa là token không có context multi-tenant
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token thiếu tenant_id",
        )

    return TokenPayload(
        user_id=user_id,
        tenant_id=tenant_id,
        role=role or "",
        branch_id=branch_id,
        permissions=permissions if isinstance(permissions, list) else [],
    )
