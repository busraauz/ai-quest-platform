from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from supabase import Client
from typing import Any, Dict

from supabase_auth import SignUpWithEmailAndPasswordCredentials

from app.db.client import get_supabase_client
from app.schemas.auth import UserLogin, UserSignup
from app.api.deps.auth import get_current_user, get_bearer_token

router = APIRouter(prefix="/auth", tags=["auth"])


def _serialize_auth_response(res: Any) -> Dict[str, Any]:
    """Serialize Supabase auth response to dict"""
    if hasattr(res, "model_dump"):
        return res.model_dump()
    if hasattr(res, "dict"):
        return res.dict()
    return res


def _set_auth_cookie(response: JSONResponse, token: str) -> None:
    """Set secure authentication cookie with best practices"""
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,  # Prevent XSS attacks
        secure=True,  # HTTPS only (set to False for local dev if needed)
        samesite="lax",  # CSRF protection
        max_age=3600,  # 1 hour expiration
        path="/",  # Cookie available for all paths
    )


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(
    user: UserSignup,
    supabase: Client = Depends(get_supabase_client),
) -> JSONResponse:
    """
    Create a new user account

    - **email**: Valid email address
    - **password**: Minimum 8 characters
    - **display_name**: Optional display name
    """
    try:
        payload: SignUpWithEmailAndPasswordCredentials = {
            "email": user.email,
            "password": user.password,
            "options": (
                {"data": {"display_name": user.display_name}}
                if user.display_name
                else {}
            ),
        }

        res = supabase.auth.sign_up(payload)
        data = jsonable_encoder(_serialize_auth_response(res))

        # Check if email confirmation is required
        if not data.get("session"):
            return JSONResponse(
                status_code=status.HTTP_201_CREATED,
                content={
                    "message": "Account created successfully. Please check your email to confirm your account.",
                    "user": data.get("user"),
                },
            )

        # Auto-login if email confirmation is disabled
        token = data.get("session", {}).get("access_token")
        response = JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "message": "Account created successfully",
                "session": data.get("session"),
                "user": data.get("user"),
            },
        )

        if token:
            _set_auth_cookie(response, token)

        return response

    except Exception as e:
        error_message = str(e)
        if "already registered" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=error_message
        )


@router.post("/login")
async def login(
    user: UserLogin,
    supabase: Client = Depends(get_supabase_client),
) -> JSONResponse:
    """
    Authenticate user and create session

    - **email**: User's email address
    - **password**: User's password
    """
    try:
        res = supabase.auth.sign_in_with_password(
            {
                "email": user.email,
                "password": user.password,
            }
        )
        data = jsonable_encoder(_serialize_auth_response(res))

        session = data.get("session")
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
            )

        token = session.get("access_token")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate session token",
            )

        response = JSONResponse(
            content={
                "message": "Login successful",
                "session": session,
                "user": data.get("user"),
            }
        )
        _set_auth_cookie(response, token)

        return response

    except HTTPException:
        raise
    except Exception as e:
        error_message = str(e)
        if "invalid" in error_message.lower() or "credentials" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=error_message
        )


@router.post("/logout")
async def logout(
    supabase: Client = Depends(get_supabase_client),
) -> JSONResponse:
    """
    Sign out the current user and invalidate session
    """
    try:
        # Use the correct signout method (not admin API)
        supabase.auth.sign_out()

        response = JSONResponse(content={"message": "Logged out successfully"})
        # Clear the auth cookie
        response.delete_cookie(key="access_token", path="/", samesite="lax")

        return response

    except Exception as e:
        # Even if signout fails, clear the cookie
        response = JSONResponse(content={"message": "Logged out successfully"})
        response.delete_cookie(key="access_token", path="/", samesite="lax")
        return response


@router.post("/refresh")
async def refresh_token(
    token: str = Depends(get_bearer_token),
    supabase: Client = Depends(get_supabase_client),
) -> JSONResponse:
    """
    Refresh the current session token
    """
    try:
        res = supabase.auth.refresh_session()
        data = jsonable_encoder(_serialize_auth_response(res))

        session = data.get("session")
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to refresh session",
            )

        new_token = session.get("access_token")
        response = JSONResponse(
            content={
                "message": "Token refreshed successfully",
                "session": session,
            }
        )

        if new_token:
            _set_auth_cookie(response, new_token)

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Failed to refresh token"
        )


@router.get("/me")
async def get_current_user_info(user=Depends(get_current_user)) -> Dict[str, Any]:
    """
    Get current authenticated user information
    """
    return jsonable_encoder(user)
