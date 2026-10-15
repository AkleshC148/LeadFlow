import asyncio
from datetime import datetime, timedelta, timezone
import os
import sys
from pathlib import Path

# Add backend directory to sys.path so app imports work
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.db import init_db
from app.security import hash_password


async def seed() -> None:
    mongodb_uri = os.getenv("MONGODB_URI", settings.MONGODB_URI)
    mongodb_db_name = os.getenv("MONGODB_DB_NAME", settings.MONGODB_DB_NAME)

    client = AsyncIOMotorClient(mongodb_uri, tz_aware=True)
    db = client[mongodb_db_name]

    # Initialize indexes
    await init_db()

    demo_email = "demo@leadflow.dev"
    demo_password = "Demo@1234"

    # Idempotent cleanup: delete existing demo user data first
    existing_users = await db.users.find({"email": demo_email}).to_list(length=100)
    for u in existing_users:
        uid = u["_id"]
        await db.discussions.delete_many({"owner_id": uid})
        await db.leads.delete_many({"owner_id": uid})
    await db.users.delete_many({"email": demo_email})

    now = datetime.now(timezone.utc)

    # Create demo user
    user_doc = {
        "name": "Demo User",
        "email": demo_email,
        "password_hash": hash_password(demo_password),
        "created_at": now - timedelta(days=30),
    }
    user_res = await db.users.insert_one(user_doc)
    owner_id = user_res.inserted_id

    # Dates calculation
    today_date = now.date()
    due_today_1 = datetime(today_date.year, today_date.month, today_date.day, 16, 0, 0, tzinfo=timezone.utc)
    due_today_2 = datetime(today_date.year, today_date.month, today_date.day, 19, 30, 0, tzinfo=timezone.utc)
    overdue_1 = now - timedelta(days=2, hours=4)
    overdue_2 = now - timedelta(days=4, hours=1)
    future_1 = now + timedelta(days=5, hours=2)

    # 7 leads covering all 6 statuses
    # 2 due TODAY, 2 OVERDUE (not Won/Lost), 1 in future, rest with no follow-up
    # 2-4 discussions each
    leads_seed_data = [
        # Lead 1: Qualified - due TODAY
        {
            "name": "Alice Johnson",
            "company": "Apex Global",
            "phone": "+1-555-0111",
            "status": "Qualified",
            "follow_up_at": due_today_1,
            "discussions": [
                {
                    "created_at": now - timedelta(days=6, hours=2),
                    "note": "Discovery call completed. Qualified budget and project timeline.",
                    "follow_up_at": now - timedelta(days=3),
                },
                {
                    "created_at": now - timedelta(days=2, hours=4),
                    "note": "Sent technical architecture specifications.",
                    "follow_up_at": now - timedelta(hours=6),
                },
                {
                    "created_at": now - timedelta(hours=3),
                    "note": "Final technical review scheduled for this afternoon.",
                    "follow_up_at": due_today_1,
                },
            ],
        },
        # Lead 2: Contacted - due TODAY
        {
            "name": "Bob Martinez",
            "company": "Beacon Tech",
            "phone": "+1-555-0122",
            "status": "Contacted",
            "follow_up_at": due_today_2,
            "discussions": [
                {
                    "created_at": now - timedelta(days=3, hours=5),
                    "note": "Initial outreach email sent via marketing campaign.",
                    "follow_up_at": None,
                },
                {
                    "created_at": now - timedelta(hours=5),
                    "note": "Lead replied expressing interest. Discovery call set for this evening.",
                    "follow_up_at": due_today_2,
                },
            ],
        },
        # Lead 3: New - OVERDUE (not Won/Lost)
        {
            "name": "Catherine Davis",
            "company": "CloudScale Inc",
            "phone": "+1-555-0133",
            "status": "New",
            "follow_up_at": overdue_1,
            "discussions": [
                {
                    "created_at": now - timedelta(days=6),
                    "note": "Inbound demo request received via website.",
                    "follow_up_at": now - timedelta(days=4),
                },
                {
                    "created_at": now - timedelta(days=3),
                    "note": "Attempted phone contact; need to follow up on demo availability.",
                    "follow_up_at": overdue_1,
                },
            ],
        },
        # Lead 4: Proposal Sent - OVERDUE (not Won/Lost)
        {
            "name": "Daniel Wright",
            "company": "DataPulse Analytics",
            "phone": "+1-555-0144",
            "status": "Proposal Sent",
            "follow_up_at": overdue_2,
            "discussions": [
                {
                    "created_at": now - timedelta(days=12),
                    "note": "Intro meeting held with operations team.",
                    "follow_up_at": now - timedelta(days=9),
                },
                {
                    "created_at": now - timedelta(days=8),
                    "note": "Demoed reporting analytics dashboard.",
                    "follow_up_at": now - timedelta(days=6),
                },
                {
                    "created_at": now - timedelta(days=6),
                    "note": "Proposal draft delivered to CFO.",
                    "follow_up_at": now - timedelta(days=5),
                },
                {
                    "created_at": now - timedelta(days=5),
                    "note": "Awaiting signature on executive proposal package.",
                    "follow_up_at": overdue_2,
                },
            ],
        },
        # Lead 5: Contacted - in the FUTURE
        {
            "name": "Elena Rostova",
            "company": "Echo Systems",
            "phone": "+1-555-0155",
            "status": "Contacted",
            "follow_up_at": future_1,
            "discussions": [
                {
                    "created_at": now - timedelta(days=7),
                    "note": "Initial connection made at industry summit.",
                    "follow_up_at": now - timedelta(days=3),
                },
                {
                    "created_at": now - timedelta(days=3),
                    "note": "Followed up with comprehensive case study deck.",
                    "follow_up_at": now - timedelta(days=1),
                },
                {
                    "created_at": now - timedelta(days=1),
                    "note": "Client traveling until next week. Scheduled check-in call.",
                    "follow_up_at": future_1,
                },
            ],
        },
        # Lead 6: Won - no follow-up
        {
            "name": "Frank Gallagher",
            "company": "Frontier Dynamics",
            "phone": "+1-555-0166",
            "status": "Won",
            "follow_up_at": None,
            "discussions": [
                {
                    "created_at": now - timedelta(days=20),
                    "note": "Initial project scoping session.",
                    "follow_up_at": now - timedelta(days=14),
                },
                {
                    "created_at": now - timedelta(days=10),
                    "note": "Contract terms and SLA agreed.",
                    "follow_up_at": now - timedelta(days=4),
                },
                {
                    "created_at": now - timedelta(days=3),
                    "note": "Contract signed, deposit cleared. Account successfully onboarded.",
                    "follow_up_at": None,
                },
            ],
        },
        # Lead 7: Lost - no follow-up
        {
            "name": "Grace Hopper",
            "company": "GigaByte Solutions",
            "phone": "+1-555-0177",
            "status": "Lost",
            "follow_up_at": None,
            "discussions": [
                {
                    "created_at": now - timedelta(days=18),
                    "note": "Product demo call completed with lead engineer.",
                    "follow_up_at": now - timedelta(days=12),
                },
                {
                    "created_at": now - timedelta(days=7),
                    "note": "Decided to build proprietary solution in-house. Opportunity closed as lost.",
                    "follow_up_at": None,
                },
            ],
        },
    ]

    for item in leads_seed_data:
        discussions_data = item["discussions"]
        # Oldest discussion created_at is initial lead created_at
        first_created_at = discussions_data[0]["created_at"]
        last_disc = discussions_data[-1]

        lead_doc = {
            "owner_id": owner_id,
            "name": item["name"],
            "company": item["company"],
            "phone": item["phone"],
            "status": item["status"],
            "follow_up_at": item["follow_up_at"],
            "last_note": last_disc["note"],
            "last_discussion_at": last_disc["created_at"],
            "created_at": first_created_at,
            "updated_at": last_disc["created_at"],
        }
        lead_res = await db.leads.insert_one(lead_doc)
        lead_id = lead_res.inserted_id

        # Insert discussions
        disc_docs = []
        for disc in discussions_data:
            disc_docs.append({
                "lead_id": lead_id,
                "owner_id": owner_id,
                "note": disc["note"],
                "follow_up_at": disc["follow_up_at"],
                "created_at": disc["created_at"],
            })
        await db.discussions.insert_many(disc_docs)

    client.close()
    print("Database successfully seeded with demo user, leads, and discussions.")


if __name__ == "__main__":
    asyncio.run(seed())
