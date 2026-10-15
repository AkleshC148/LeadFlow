from datetime import datetime, timezone
import re
from typing import Any
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.db import get_db
from app.schemas import (
    DiscussionCreateRequest,
    DiscussionCreateResponse,
    DiscussionResponse,
    LeadCreateRequest,
    LeadResponse,
    LeadStatus,
    LeadUpdateRequest,
    doc_to_discussion,
    doc_to_lead,
)
from app.security import get_current_user

router = APIRouter()


@router.get("", response_model=list[LeadResponse], status_code=status.HTTP_200_OK)
async def get_leads(
    status_filter: str | None = Query(None, alias="status"),
    q: str | None = Query(None),
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[dict[str, Any]]:
    query: dict[str, Any] = {"owner_id": current_user["_id"]}

    if status_filter is not None:
        valid_statuses = {s.value for s in LeadStatus}
        if status_filter not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid status: '{status_filter}'. Must be one of {sorted(list(valid_statuses))}",
            )
        query["status"] = status_filter

    if q is not None and q.strip():
        safe_q = re.escape(q.strip())
        query["name"] = {"$regex": safe_q, "$options": "i"}

    cursor = db.leads.find(query).sort("updated_at", -1)
    return [doc_to_lead(doc) async for doc in cursor]


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    payload: LeadCreateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    lead_doc = {
        "owner_id": current_user["_id"],
        "name": payload.name,
        "company": payload.company,
        "phone": payload.phone,
        "status": payload.status.value,
        "follow_up_at": None,
        "last_note": None,
        "last_discussion_at": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.leads.insert_one(lead_doc)
    lead_doc["_id"] = result.inserted_id
    return doc_to_lead(lead_doc)


@router.get("/{id}", response_model=LeadResponse, status_code=status.HTTP_200_OK)
async def get_lead(
    id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, Any]:
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    lead = await db.leads.find_one({"_id": ObjectId(id), "owner_id": current_user["_id"]})
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )
    return doc_to_lead(lead)


@router.patch("/{id}", response_model=LeadResponse, status_code=status.HTTP_200_OK)
async def update_lead(
    id: str,
    payload: LeadUpdateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, Any]:
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    existing = await db.leads.find_one({"_id": ObjectId(id), "owner_id": current_user["_id"]})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    now = datetime.now(timezone.utc)
    update_fields: dict[str, Any] = {"updated_at": now}

    if "name" in payload.model_fields_set:
        update_fields["name"] = payload.name
    if "company" in payload.model_fields_set:
        update_fields["company"] = payload.company
    if "phone" in payload.model_fields_set:
        update_fields["phone"] = payload.phone
    if "status" in payload.model_fields_set:
        update_fields["status"] = payload.status.value if payload.status else None
    if "follow_up_at" in payload.model_fields_set:
        update_fields["follow_up_at"] = payload.follow_up_at

    updated_lead = await db.leads.find_one_and_update(
        {"_id": ObjectId(id), "owner_id": current_user["_id"]},
        {"$set": update_fields},
        return_document=ReturnDocument.AFTER,
    )
    return doc_to_lead(updated_lead)


@router.get("/{id}/discussions", response_model=list[DiscussionResponse], status_code=status.HTTP_200_OK)
async def get_discussions(
    id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[dict[str, Any]]:
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    lead = await db.leads.find_one({"_id": ObjectId(id), "owner_id": current_user["_id"]})
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    cursor = db.discussions.find(
        {"lead_id": ObjectId(id), "owner_id": current_user["_id"]}
    ).sort("created_at", -1)
    return [doc_to_discussion(doc) async for doc in cursor]


@router.post("/{id}/discussions", response_model=DiscussionCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_discussion(
    id: str,
    payload: DiscussionCreateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict[str, Any]:
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    lead = await db.leads.find_one({"_id": ObjectId(id), "owner_id": current_user["_id"]})
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    now = datetime.now(timezone.utc)
    disc_doc = {
        "lead_id": ObjectId(id),
        "owner_id": current_user["_id"],
        "note": payload.note,
        "follow_up_at": payload.follow_up_at,
        "created_at": now,
    }
    result = await db.discussions.insert_one(disc_doc)
    disc_doc["_id"] = result.inserted_id

    lead_update: dict[str, Any] = {
        "last_note": payload.note,
        "last_discussion_at": now,
        "updated_at": now,
    }
    if "follow_up_at" in payload.model_fields_set:
        lead_update["follow_up_at"] = payload.follow_up_at

    updated_lead = await db.leads.find_one_and_update(
        {"_id": ObjectId(id), "owner_id": current_user["_id"]},
        {"$set": lead_update},
        return_document=ReturnDocument.AFTER,
    )

    return {
        "discussion": doc_to_discussion(disc_doc),
        "lead": doc_to_lead(updated_lead),
    }
