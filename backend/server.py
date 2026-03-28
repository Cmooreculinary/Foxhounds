from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT config
JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

# Password utils
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# Create app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TastingKitCreate(BaseModel):
    name: str
    region: str
    description: str
    price: float
    image_url: Optional[str] = None
    category: str = "wine"

class EventCreate(BaseModel):
    title: str
    description: str
    venue: str
    location: str
    date: str
    time: str
    price: float
    format: str = "In Person"
    seats_total: int = 50
    image_url: Optional[str] = None

class PackCreate(BaseModel):
    name: str
    emoji: str = ""
    location: str
    member_count: int = 0
    format: str = "In-Person"
    tags: List[str] = []
    description: Optional[str] = None

class JournalEntryCreate(BaseModel):
    spirit_name: str
    vintage: Optional[str] = None
    region: Optional[str] = None
    body: Optional[str] = "Medium"
    tannins: Optional[str] = "Moderate"
    finish: Optional[str] = "Medium"
    notes: Optional[str] = None
    image_url: Optional[str] = None

class PartnerInquiryCreate(BaseModel):
    business_name: str
    business_type: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    interests: List[str] = []

class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/register")
async def register(req: RegisterRequest, response: Response):
    email = req.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(req.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": req.name,
        "role": "user",
        "membership": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "location": "",
        "bio": "",
        "tastings_count": 0,
        "connections_count": 0,
        "packs_count": 0,
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "email": email, "name": req.name, "role": "user", "membership": None}

@api_router.post("/auth/login")
async def login(req: LoginRequest, request: Request, response: Response):
    email = req.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    # Brute force check
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        lockout_until = attempt.get("locked_until")
        if lockout_until and datetime.now(timezone.utc) < datetime.fromisoformat(lockout_until):
            raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {
        "id": user_id, "email": user["email"], "name": user.get("name", ""),
        "role": user.get("role", "user"), "membership": user.get("membership"),
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ============== TASTING KITS ==============

@api_router.get("/kits")
async def get_kits():
    kits = await db.tasting_kits.find({}, {"_id": 0}).to_list(100)
    return kits

@api_router.get("/kits/{kit_id}")
async def get_kit(kit_id: str):
    kit = await db.tasting_kits.find_one({"id": kit_id}, {"_id": 0})
    if not kit:
        raise HTTPException(status_code=404, detail="Kit not found")
    return kit

@api_router.post("/admin/kits")
async def create_kit(kit: TastingKitCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    doc = kit.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.tasting_kits.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/admin/kits/{kit_id}")
async def update_kit(kit_id: str, kit: TastingKitCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.tasting_kits.update_one({"id": kit_id}, {"$set": kit.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kit not found")
    return {"message": "Updated"}

@api_router.delete("/admin/kits/{kit_id}")
async def delete_kit(kit_id: str, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    await db.tasting_kits.delete_one({"id": kit_id})
    return {"message": "Deleted"}

# ============== EVENTS ==============

@api_router.get("/events")
async def get_events():
    events = await db.events.find({}, {"_id": 0}).to_list(100)
    return events

@api_router.get("/events/{event_id}")
async def get_event(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@api_router.post("/admin/events")
async def create_event(event: EventCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    doc = event.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["seats_remaining"] = doc["seats_total"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.events.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/admin/events/{event_id}")
async def update_event(event_id: str, event: EventCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.events.update_one({"id": event_id}, {"$set": event.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Updated"}

@api_router.delete("/admin/events/{event_id}")
async def delete_event(event_id: str, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    await db.events.delete_one({"id": event_id})
    return {"message": "Deleted"}

# ============== FOXHOUND PACKS ==============

@api_router.get("/packs")
async def get_packs():
    packs = await db.packs.find({}, {"_id": 0}).to_list(100)
    return packs

@api_router.post("/packs")
async def create_pack(pack: PackCreate, request: Request):
    user = await get_current_user(request)
    doc = pack.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["members"] = [user["_id"]]
    doc["member_count"] = 1
    doc["created_by"] = user["_id"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.packs.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.post("/packs/{pack_id}/join")
async def join_pack(pack_id: str, request: Request):
    user = await get_current_user(request)
    pack = await db.packs.find_one({"id": pack_id})
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found")
    if user["_id"] in pack.get("members", []):
        raise HTTPException(status_code=400, detail="Already a member")
    await db.packs.update_one({"id": pack_id}, {"$push": {"members": user["_id"]}, "$inc": {"member_count": 1}})
    return {"message": "Joined pack"}

# ============== JOURNAL ==============

@api_router.get("/journal")
async def get_journal(request: Request):
    user = await get_current_user(request)
    entries = await db.journal.find({"user_id": user["_id"]}, {"_id": 0}).to_list(100)
    return entries

@api_router.post("/journal")
async def create_journal_entry(entry: JournalEntryCreate, request: Request):
    user = await get_current_user(request)
    doc = entry.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["user_id"] = user["_id"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.journal.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/journal/{entry_id}")
async def delete_journal_entry(entry_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.journal.delete_one({"id": entry_id, "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Deleted"}

# ============== PARTNER INQUIRIES ==============

@api_router.post("/partner-inquiry")
async def create_partner_inquiry(inquiry: PartnerInquiryCreate):
    doc = inquiry.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "pending"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.partner_inquiries.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/admin/partner-inquiries")
async def get_partner_inquiries(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    inquiries = await db.partner_inquiries.find({}, {"_id": 0}).to_list(100)
    return inquiries

@api_router.put("/admin/partner-inquiries/{inquiry_id}/status")
async def update_inquiry_status(inquiry_id: str, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    body = await request.json()
    status = body.get("status", "reviewed")
    await db.partner_inquiries.update_one({"id": inquiry_id}, {"$set": {"status": status}})
    return {"message": "Updated"}

# ============== MEMBERSHIP / STRIPE ==============

MEMBERSHIP_PLANS = {
    "enthusiast_monthly": {"name": "Enthusiast Monthly", "price": 9.99, "interval": "month"},
    "connoisseur_monthly": {"name": "Connoisseur Monthly", "price": 24.99, "interval": "month"},
    "sommelier_annual": {"name": "Sommelier Annual", "price": 199.99, "interval": "year"},
}

@api_router.get("/membership/plans")
async def get_plans():
    plans = []
    for plan_id, plan in MEMBERSHIP_PLANS.items():
        plans.append({"id": plan_id, **plan})
    return plans

@api_router.post("/membership/checkout")
async def create_membership_checkout(req: CheckoutRequest, request: Request):
    user = await get_current_user(request)
    plan = MEMBERSHIP_PLANS.get(req.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")

    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = req.origin_url.rstrip("/")
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)

    success_url = f"{host_url}/membership/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/membership"

    checkout_req = CheckoutSessionRequest(
        amount=float(plan["price"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["_id"],
            "user_email": user["email"],
            "plan_id": req.plan_id,
            "plan_name": plan["name"],
        }
    )
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_req)

    # Record transaction
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": user["_id"],
        "email": user["email"],
        "plan_id": req.plan_id,
        "amount": plan["price"],
        "currency": "usd",
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/membership/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    user = await get_current_user(request)
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)

    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)

    # Update transaction
    txn = await db.payment_transactions.find_one({"session_id": session_id})
    if txn and txn.get("payment_status") != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": status.payment_status, "status": status.status}}
        )
        # If paid, update user membership
        if status.payment_status == "paid":
            plan_id = status.metadata.get("plan_id", "") if status.metadata else ""
            user_id = status.metadata.get("user_id", "") if status.metadata else ""
            if user_id:
                await db.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {"membership": plan_id, "membership_since": datetime.now(timezone.utc).isoformat()}}
                )

    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, sig)
        if webhook_response.payment_status == "paid":
            txn = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
            if txn and txn.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"payment_status": "paid", "status": "complete"}}
                )
                plan_id = webhook_response.metadata.get("plan_id", "") if webhook_response.metadata else ""
                user_id = webhook_response.metadata.get("user_id", "") if webhook_response.metadata else ""
                if user_id:
                    await db.users.update_one(
                        {"_id": ObjectId(user_id)},
                        {"$set": {"membership": plan_id, "membership_since": datetime.now(timezone.utc).isoformat()}}
                    )
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

# ============== ADMIN STATS ==============

@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    users_count = await db.users.count_documents({})
    events_count = await db.events.count_documents({})
    kits_count = await db.tasting_kits.count_documents({})
    packs_count = await db.packs.count_documents({})
    inquiries_count = await db.partner_inquiries.count_documents({"status": "pending"})
    transactions = await db.payment_transactions.find({"payment_status": "paid"}, {"_id": 0}).to_list(1000)
    total_revenue = sum(t.get("amount", 0) for t in transactions)
    return {
        "users": users_count,
        "events": events_count,
        "kits": kits_count,
        "packs": packs_count,
        "pending_inquiries": inquiries_count,
        "total_revenue": total_revenue,
        "total_transactions": len(transactions),
    }

@api_router.get("/admin/users")
async def get_admin_users(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    users = await db.users.find({}, {"password_hash": 0}).to_list(1000)
    for u in users:
        u["_id"] = str(u["_id"])
    return users

# ============== SEED DATA ==============

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@vineandbarrel.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "VineBarrel2026!")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email, "password_hash": hashed, "name": "Admin",
            "role": "admin", "membership": "sommelier_annual",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "location": "Napa Valley, CA", "bio": "Platform administrator",
            "tastings_count": 47, "connections_count": 12, "packs_count": 3,
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

async def seed_data():
    # Seed tasting kits
    if await db.tasting_kits.count_documents({}) == 0:
        kits = [
            {"id": str(uuid.uuid4()), "name": "Estate Reserve Collection", "region": "Napa Valley",
             "description": "Three exceptional estate wines from Napa's most celebrated vineyards. Includes a 2019 Cabernet Sauvignon, 2020 Chardonnay, and 2018 Merlot Reserve.",
             "price": 185.00, "category": "wine",
             "image_url": "https://images.pexels.com/photos/34335270/pexels-photo-34335270.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Peated Classics Trio", "region": "Scottish Highlands",
             "description": "A journey through Scotland's finest peated single malts. Featuring expressions from Islay, Speyside, and Highland distilleries.",
             "price": 240.00, "category": "spirits",
             "image_url": "https://images.unsplash.com/photo-1769734416095-30fbc03e7bb7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHx3aGlza2V5JTIwZ2xhc3MlMjBkYXJrJTIwbW9vZHxlbnwwfHx8fDE3NzQ3Mjk4MDR8MA&ixlib=rb-4.1.0&q=85",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Burgundy Discovery", "region": "Burgundy, France",
             "description": "Explore the terroir of Burgundy with three Pinot Noirs from premier cru vineyards. A masterclass in French winemaking.",
             "price": 210.00, "category": "wine",
             "image_url": "https://images.unsplash.com/photo-1765850257843-aa029ab7769c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3aW5lJTIwY2VsbGFyJTIwZGFya3xlbnwwfHx8fDE3NzQ3Mjk4MDJ8MA&ixlib=rb-4.1.0&q=85",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Agave Heritage Collection", "region": "Jalisco, Mexico",
             "description": "Premium tequila and mezcal expressions. Includes Blanco, Reposado, and a rare Anejo from family-owned distilleries.",
             "price": 195.00, "category": "spirits",
             "image_url": "https://images.pexels.com/photos/8775199/pexels-photo-8775199.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
             "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.tasting_kits.insert_many(kits)

    # Seed events
    if await db.events.count_documents({}) == 0:
        events = [
            {"id": str(uuid.uuid4()), "title": "Napa Meets Tuscany", "description": "Chef Keaveny pairs Napa Cabernets with Tuscan cuisine in this exclusive hybrid tasting.",
             "venue": "Tavola", "location": "Charlottesville, VA", "date": "2026-02-15", "time": "3:00 PM - 5:00 PM EST",
             "price": 89.00, "format": "Hybrid", "seats_total": 30, "seats_remaining": 7,
             "image_url": "https://images.pexels.com/photos/8775199/pexels-photo-8775199.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "title": "Single Malt Masterclass", "description": "Deep dive into the world of single malt Scotch whisky with Master Distiller Ian MacLeod.",
             "venue": "Copper & Oak", "location": "New York, NY", "date": "2026-02-22", "time": "7:00 PM - 9:00 PM EST",
             "price": 120.00, "format": "In Person", "seats_total": 25, "seats_remaining": 12,
             "image_url": "https://images.unsplash.com/photo-1769734416095-30fbc03e7bb7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHx3aGlza2V5JTIwZ2xhc3MlMjBkYXJrJTIwbW9vZHxlbnwwfHx8fDE3NzQ3Mjk4MDR8MA&ixlib=rb-4.1.0&q=85",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "title": "Artisanal Gin Workshop", "description": "Learn the art of gin distillation and craft your own botanical blend to take home.",
             "venue": "Botanist Lounge", "location": "Virtual", "date": "2026-03-05", "time": "6:00 PM - 8:00 PM EST",
             "price": 65.00, "format": "Virtual", "seats_total": 50, "seats_remaining": 34,
             "image_url": "https://images.unsplash.com/photo-1765850257843-aa029ab7769c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3aW5lJTIwY2VsbGFyJTIwZGFya3xlbnwwfHx8fDE3NzQ3Mjk4MDJ8MA&ixlib=rb-4.1.0&q=85",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "title": "Bordeaux Vertical Tasting", "description": "Chateau Latour masterclass spanning five exceptional vintages from 2005 to 2018.",
             "venue": "The Wine Vault", "location": "San Francisco, CA", "date": "2026-03-15", "time": "2:00 PM - 5:00 PM PST",
             "price": 145.00, "format": "In Person", "seats_total": 20, "seats_remaining": 5,
             "image_url": "https://images.pexels.com/photos/34335270/pexels-photo-34335270.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
             "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.events.insert_many(events)

    # Seed packs
    if await db.packs.count_documents({}) == 0:
        packs = [
            {"id": str(uuid.uuid4()), "name": "The Napa Hounds", "emoji": "fox", "location": "Napa Valley, CA",
             "member_count": 24, "format": "In-Person + Virtual", "tags": ["Cabernets", "Estate Tours", "Monthly Meets"],
             "description": "Napa Valley's premier tasting pack. Monthly vineyard visits and quarterly vertical tastings.",
             "members": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "NYC Barrel Club", "emoji": "tumbler_glass", "location": "Manhattan, NY",
             "member_count": 41, "format": "In-Person", "tags": ["Bourbon", "Whiskey", "Speakeasies"],
             "description": "Manhattan's finest spirits enthusiasts. Speakeasy tours and rare bottle shares.",
             "members": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "ATX Sippers", "emoji": "wine_glass", "location": "Austin, TX",
             "member_count": 18, "format": "Hybrid", "tags": ["Natural Wine", "Patio Sessions"],
             "description": "Austin's natural wine community. Patio tastings and winemaker meetups.",
             "members": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "London Cru Circle", "emoji": "gb", "location": "London, UK",
             "member_count": 32, "format": "Virtual Only", "tags": ["Old World", "Cellaring", "Zoom Tastings"],
             "description": "Virtual community for Old World wine enthusiasts. Monthly Zoom tastings with UK sommeliers.",
             "members": [], "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.packs.insert_many(packs)

# ============== ROOT / HEALTH ==============

@api_router.get("/")
async def root():
    return {"message": "Vine & Barrel API", "status": "operational"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await seed_admin()
    await seed_data()
    logger.info("Vine & Barrel API started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
