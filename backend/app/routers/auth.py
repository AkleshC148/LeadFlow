from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db import get_db
from app.schemas import (
    AuthResponse,
    LoginRequest,
    SignupRequest,
    UserResponse,
    doc_to_user,
)
from app.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter()


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, db: AsyncIOMotorDatabase = Depends(get_db)) -> dict[str, Any]:
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    now = datetime.now(timezone.utc)
    hashed_password = hash_password(payload.password)
    user_doc = {
        "name": payload.name,
        "email": email,
        "password_hash": hashed_password,
        "created_at": now,
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    access_token = create_access_token({"sub": str(user_doc["_id"])})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": doc_to_user(user_doc),
    }


@router.post("/login", response_model=AuthResponse, status_code=status.HTTP_200_OK)
async def login(payload: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)) -> dict[str, Any]:
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token({"sub": str(user["_id"])})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": doc_to_user(user),
    }


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def me(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return doc_to_user(current_user)
