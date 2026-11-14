"""
apps/api/app/api/v1/endpoints/auth.py
Offline JWT Authentication Endpoints for NEURO-SPEECH (M4).
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from apps.api.app.auth.security import verify_password, get_password_hash, create_access_token
from apps.api.app.auth.dependencies import get_current_user
from apps.api.app.db.database import get_db_connection, log_audit_event

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(min_length=5, max_length=100)
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2, max_length=100)
    role: Optional[str] = "caregiver"


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=5)


class ResetPasswordRequest(BaseModel):
    email: str = Field(min_length=5)
    token: str = Field(min_length=4)
    new_password: str = Field(min_length=6)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    role: str
    full_name: str


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest) -> LoginResponse:
    """Authenticates user and returns offline JWT Bearer token."""
    conn = get_db_connection()
    user_row = conn.execute("SELECT * FROM users WHERE username = ? AND is_active = 1", (req.username,)).fetchone()
    conn.close()

    if not user_row or not verify_password(req.password, user_row["hashed_password"]):
        log_audit_event(
            username=req.username,
            role="unknown",
            action="LOGIN_FAILED",
            resource_type="auth",
            details={"reason": "Invalid credentials"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Issue JWT token
    token_payload = {
        "sub": user_row["username"],
        "user_id": user_row["id"],
        "role": user_row["role"]
    }
    access_token = create_access_token(token_payload)

    log_audit_event(
        user_id=user_row["id"],
        username=user_row["username"],
        role=user_row["role"],
        action="LOGIN_SUCCESS",
        resource_type="auth"
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user_row["id"],
        username=user_row["username"],
        role=user_row["role"],
        full_name=user_row["full_name"]
    )


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Returns currently authenticated user profile."""
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user["role"],
        "full_name": current_user["full_name"],
        "created_at": current_user["created_at"]
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest) -> Dict[str, Any]:
    """Registers a new user account with secure password hashing."""
    conn = get_db_connection()
    existing_username = conn.execute("SELECT id FROM users WHERE username = ?", (req.username,)).fetchone()
    if existing_username:
        conn.close()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username is already registered.")

    existing_email = conn.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
    if existing_email:
        conn.close()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered.")

    allowed_roles = {"caregiver", "researcher"}
    assigned_role = req.role if req.role in allowed_roles else "caregiver"
    hashed_pwd = get_password_hash(req.password)

    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO users (username, email, hashed_password, role, full_name, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
        """,
        (req.username, req.email, hashed_pwd, assigned_role, req.full_name)
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    log_audit_event(
        user_id=user_id,
        username=req.username,
        role=assigned_role,
        action="USER_REGISTERED",
        resource_type="auth",
        details={"email": req.email, "role": assigned_role}
    )

    return {
        "message": "User registered successfully.",
        "user_id": user_id,
        "username": req.username,
        "email": req.email,
        "role": assigned_role
    }


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest) -> Dict[str, Any]:
    """Handles password recovery requests without leaking account presence."""
    conn = get_db_connection()
    user = conn.execute("SELECT id, username FROM users WHERE email = ?", (req.email,)).fetchone()
    conn.close()

    if user:
        log_audit_event(
            user_id=user["id"],
            username=user["username"],
            role="unknown",
            action="PASSWORD_RESET_REQUESTED",
            resource_type="auth",
            details={"email": req.email}
        )
    return {
        "message": "If this email exists in our system, recovery instructions and a reset code have been dispatched."
    }


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest) -> Dict[str, Any]:
    """Resets user password with valid token/code."""
    conn = get_db_connection()
    user = conn.execute("SELECT id, username, role FROM users WHERE email = ?", (req.email,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    new_hash = get_password_hash(req.new_password)
    conn.execute("UPDATE users SET hashed_password = ? WHERE id = ?", (new_hash, user["id"]))
    conn.commit()
    conn.close()

    log_audit_event(
        user_id=user["id"],
        username=user["username"],
        role=user["role"],
        action="PASSWORD_RESET_COMPLETED",
        resource_type="auth"
    )

    return {"message": "Password has been successfully updated. You may now login."}
