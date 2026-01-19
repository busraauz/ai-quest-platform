from fastapi import Depends, HTTPException, status
from supabase import Client

from fastapi import Cookie, Header, HTTPException, status

from app.db.client import get_supabase_client


def get_bearer_token(
    authorization: str | None = Header(default=None),
    access_token: str | None = Cookie(default=None),
) -> str:
    if authorization:
        parts = authorization.split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer" and parts[1].strip():
            return parts[1].strip()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header",
        )
    if access_token:
        return access_token
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header"
    )


async def get_current_user(
    token: str = Depends(get_bearer_token),
    supabase: Client = Depends(get_supabase_client),
):
    try:
        response = supabase.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    if not response or not getattr(response, "user", None):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return response.user
