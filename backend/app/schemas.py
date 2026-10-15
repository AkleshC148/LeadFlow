from datetime import datetime, timezone
from enum import Enum
from typing import Any
from pydantic import BaseModel, field_validator


class LeadStatus(str, Enum):
    NEW = "New"
    CONTACTED = "Contacted"
    QUALIFIED = "Qualified"
    PROPOSAL_SENT = "Proposal Sent"
    WON = "Won"
    LOST = "Lost"


def serialize_datetime(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")


def normalize_utc_datetime(v: Any) -> datetime | None:
    if v is None:
        return None
    if isinstance(v, datetime):
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v.astimezone(timezone.utc)
    if isinstance(v, str):
        v = v.strip()
        if not v:
            return None
        try:
            dt = datetime.fromisoformat(v)
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception:
            raise ValueError("Invalid datetime format. Expected ISO-8601 string.")
    raise ValueError("Invalid datetime value.")


# MongoDB Document to dict converters
def doc_to_user(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "email": doc.get("email", ""),
    }


def doc_to_lead(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "company": doc.get("company"),
        "phone": doc.get("phone"),
        "status": doc.get("status", LeadStatus.NEW.value),
        "follow_up_at": serialize_datetime(doc.get("follow_up_at")),
        "last_note": doc.get("last_note"),
        "last_discussion_at": serialize_datetime(doc.get("last_discussion_at")),
        "created_at": serialize_datetime(doc.get("created_at")),
        "updated_at": serialize_datetime(doc.get("updated_at")),
    }


def doc_to_discussion(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "lead_id": str(doc.get("lead_id", "")),
        "note": doc.get("note", ""),
        "follow_up_at": serialize_datetime(doc.get("follow_up_at")),
        "created_at": serialize_datetime(doc.get("created_at")),
    }


# Auth Schemas
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not v or "@" not in v:
            raise ValueError("Invalid email format")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("Email cannot be empty")
        return v


class UserResponse(BaseModel):
    id: str
    name: str
    email: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Lead Schemas
class LeadResponse(BaseModel):
    id: str
    name: str
    company: str | None = None
    phone: str | None = None
    status: LeadStatus
    follow_up_at: str | None = None
    last_note: str | None = None
    last_discussion_at: str | None = None
    created_at: str
    updated_at: str


class LeadCreateRequest(BaseModel):
    name: str
    company: str | None = None
    phone: str | None = None
    status: LeadStatus = LeadStatus.NEW

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name is required and cannot be empty")
        return v

    @field_validator("company", "phone")
    @classmethod
    def clean_optional_str(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            return v if v else None
        return None


class LeadUpdateRequest(BaseModel):
    name: str | None = None
    company: str | None = None
    phone: str | None = None
    status: LeadStatus | None = None
    follow_up_at: datetime | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Name cannot be empty")
        return v

    @field_validator("company", "phone")
    @classmethod
    def clean_optional_str(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            return v if v else None
        return None

    @field_validator("follow_up_at", mode="before")
    @classmethod
    def validate_follow_up_at(cls, v: Any) -> datetime | None:
        return normalize_utc_datetime(v)


# Discussion Schemas
class DiscussionResponse(BaseModel):
    id: str
    lead_id: str
    note: str
    follow_up_at: str | None = None
    created_at: str


class DiscussionCreateRequest(BaseModel):
    note: str
    follow_up_at: datetime | None = None

    @field_validator("note")
    @classmethod
    def validate_note(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Note is required and cannot be empty")
        return v

    @field_validator("follow_up_at", mode="before")
    @classmethod
    def validate_follow_up_at(cls, v: Any) -> datetime | None:
        return normalize_utc_datetime(v)


class DiscussionCreateResponse(BaseModel):
    discussion: DiscussionResponse
    lead: LeadResponse
