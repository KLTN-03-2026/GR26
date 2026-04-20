"""
Shared dependencies dùng chung cho tất cả API endpoints.
Import và dùng qua FastAPI Depends().
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import TokenPayload, verify_token

__all__ = ["get_db", "get_current_tenant", "verify_branch_access"]

# Bearer token scheme
_bearer = HTTPBearer(auto_error=True)


async def get_current_tenant(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> TokenPayload:
    """
    Dependency xác thực JWT và trả về tenant context.
    Dùng cho mọi endpoint cần auth.

    security.py đã raise HTTPException trực tiếp — không cần try/except ở đây.

    Raises:
        HTTPException 401: Token không hợp lệ hoặc hết hạn
        HTTPException 403: Token thiếu tenant_id
    """
    return verify_token(credentials.credentials)


async def verify_branch_access(
    branch_id: str,
    tenant: TokenPayload = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> str:
    """
    Kiểm tra branch thuộc tenant hiện tại — tránh tenant A đọc data tenant B.

    Query trực tiếp vào bảng branches của BE (cùng PostgreSQL database).
    Được dùng làm dependency cho các forecast endpoint.

    Args:
        branch_id: UUID chi nhánh lấy từ path parameter
        tenant: TokenPayload từ JWT (đã verify)
        db: AsyncSession

    Returns:
        branch_id đã được xác thực

    Raises:
        HTTPException 403: Branch không thuộc tenant hoặc không tồn tại
    """
    sql = text("""
        SELECT 1
        FROM branches
        WHERE id::text = :branch_id
          AND tenant_id = :tenant_id
        LIMIT 1
    """)

    result = await db.execute(sql, {
        "branch_id": branch_id,
        "tenant_id": tenant.tenant_id,
    })
    row = result.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Branch không thuộc tenant của bạn hoặc không tồn tại",
        )

    return branch_id
