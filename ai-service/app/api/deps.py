"""
Shared dependencies dùng chung cho tất cả API endpoints.
Import và dùng qua FastAPI Depends().
"""

from collections.abc import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import TokenPayload, verify_token

# Re-export get_db để các router chỉ cần import từ deps
__all__ = ["get_db", "get_current_tenant"]

# Bearer token scheme
_bearer = HTTPBearer(auto_error=True)


async def get_current_tenant(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> TokenPayload:
    """
    Dependency xác thực JWT và trả về tenant context.
    Dùng cho mọi endpoint cần auth.

    Raises:
        HTTPException 401: Token không hợp lệ hoặc hết hạn
    """
    try:
        return verify_token(credentials.credentials)
    except (ValueError, NotImplementedError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
