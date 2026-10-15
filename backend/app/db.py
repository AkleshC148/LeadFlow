from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

client = AsyncIOMotorClient(settings.MONGODB_URI, tz_aware=True)
db: AsyncIOMotorDatabase = client[settings.MONGODB_DB_NAME]


async def get_db() -> AsyncIOMotorDatabase:
    return db


async def init_db() -> None:
    # Contract indexes:
    # 1. users: email unique
    await db.users.create_index("email", unique=True)

    # 2. leads: (owner_id, status)
    await db.leads.create_index([("owner_id", 1), ("status", 1)])

    # 3. leads: (owner_id, name)
    await db.leads.create_index([("owner_id", 1), ("name", 1)])

    # 4. discussions: (lead_id, created_at desc)
    await db.discussions.create_index([("lead_id", 1), ("created_at", -1)])
