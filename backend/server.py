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
    rating: Optional[int] = None
    category: Optional[str] = "wine"
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

class CheckInCreate(BaseModel):
    venue_name: str
    drink_name: str
    category: str = "wine"
    rating: Optional[int] = None
    note: Optional[str] = None
    photo_url: Optional[str] = None

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
        "avatar_emoji": "fox",
        "checkins_count": 0,
        "friends_count": 0,
        "packs_count": 0,
        "favorite_wine": "",
        "favorite_beer": "",
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
    doc["user_name"] = user.get("name", "Anonymous")
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

# ============== SOCIAL CHECK-INS ==============

@api_router.post("/checkins")
async def create_checkin(checkin: CheckInCreate, request: Request):
    user = await get_current_user(request)
    doc = checkin.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["user_id"] = user["_id"]
    doc["user_name"] = user.get("name", "Anonymous")
    doc["likes"] = []
    doc["likes_count"] = 0
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.checkins.insert_one(doc)
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$inc": {"checkins_count": 1}})
    doc.pop("_id", None)
    return doc

@api_router.get("/checkins")
async def get_checkins():
    checkins = await db.checkins.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return checkins

@api_router.post("/checkins/{checkin_id}/like")
async def like_checkin(checkin_id: str, request: Request):
    user = await get_current_user(request)
    checkin = await db.checkins.find_one({"id": checkin_id})
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in not found")
    if user["_id"] in checkin.get("likes", []):
        await db.checkins.update_one({"id": checkin_id}, {"$pull": {"likes": user["_id"]}, "$inc": {"likes_count": -1}})
        return {"message": "Unliked", "liked": False}
    else:
        await db.checkins.update_one({"id": checkin_id}, {"$push": {"likes": user["_id"]}, "$inc": {"likes_count": 1}})
        return {"message": "Liked", "liked": True}

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
    "social_monthly": {"name": "Social Sipper", "price": 9.99, "interval": "month"},
    "packleader_monthly": {"name": "Pack Leader", "price": 24.99, "interval": "month"},
    "foxhound_annual": {"name": "Foxhound Elite", "price": 199.99, "interval": "year"},
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

    txn = await db.payment_transactions.find_one({"session_id": session_id})
    if txn and txn.get("payment_status") != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": status.payment_status, "status": status.status}}
        )
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
    checkins_count = await db.checkins.count_documents({})
    inquiries_count = await db.partner_inquiries.count_documents({"status": "pending"})
    transactions = await db.payment_transactions.find({"payment_status": "paid"}, {"_id": 0}).to_list(1000)
    total_revenue = sum(t.get("amount", 0) for t in transactions)
    return {
        "users": users_count,
        "events": events_count,
        "kits": kits_count,
        "packs": packs_count,
        "checkins": checkins_count,
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
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@foxhounds.social")
    admin_password = os.environ.get("ADMIN_PASSWORD", "VineBarrel2026!")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email, "password_hash": hashed, "name": "The Fox",
            "role": "admin", "membership": "foxhound_annual",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "location": "Charlottesville, VA", "bio": "Head of the Pack",
            "avatar_emoji": "fox",
            "checkins_count": 47, "friends_count": 128, "packs_count": 5,
            "favorite_wine": "Pinot Noir", "favorite_beer": "Hazy IPA",
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

async def seed_data():
    # Clear old seed data and re-seed with new brand
    if await db.tasting_kits.count_documents({}) > 0:
        # Check if we have the new brand data
        existing = await db.tasting_kits.find_one({"category": "craft_beer"})
        if not existing:
            await db.tasting_kits.delete_many({})
            await db.events.delete_many({})
            await db.packs.delete_many({})
            await db.checkins.delete_many({})

    # Seed tasting kits
    if await db.tasting_kits.count_documents({}) == 0:
        kits = [
            {"id": str(uuid.uuid4()), "name": "Napa Valley Estate Collection", "region": "Napa Valley, CA",
             "description": "Three exceptional estate wines from Napa's most celebrated vineyards. Includes a 2019 Cabernet Sauvignon, 2020 Chardonnay, and 2018 Merlot Reserve.",
             "price": 185.00, "category": "wine",
             "image_url": "https://images.pexels.com/photos/34335270/pexels-photo-34335270.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Hazy IPA Discovery Pack", "region": "Pacific Northwest",
             "description": "Four juicy, haze-forward IPAs from the best craft breweries of Oregon and Washington. Tropical fruit forward with silky smooth finishes.",
             "price": 65.00, "category": "craft_beer",
             "image_url": "https://images.unsplash.com/photo-1766589220911-74584516c516?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwxfHxjcmFmdCUyMGJlZXIlMjB0YXN0aW5nJTIwZGFyayUyMG1vb2R5fGVufDB8fHx8MTc3NTUxMzI4NXww&ixlib=rb-4.1.0&q=85",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Burgundy Discovery", "region": "Burgundy, France",
             "description": "Explore the terroir of Burgundy with three Pinot Noirs from premier cru vineyards. A masterclass in French winemaking.",
             "price": 210.00, "category": "wine",
             "image_url": "https://images.unsplash.com/photo-1765850257843-aa029ab7769c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3aW5lJTIwY2VsbGFyJTIwZGFya3xlbnwwfHx8fDE3NzQ3Mjk4MDJ8MA&ixlib=rb-4.1.0&q=85",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Belgian Abbey Classics", "region": "Belgium",
             "description": "Three iconic Belgian abbey ales — Dubbel, Tripel, and Quad from authentic Trappist breweries. Complex, rich, and centuries of tradition.",
             "price": 75.00, "category": "craft_beer",
             "image_url": "https://images.unsplash.com/photo-1766589221620-1a36963db1bd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwzfHxjcmFmdCUyMGJlZXIlMjB0YXN0aW5nJTIwZGFyayUyMG1vb2R5fGVufDB8fHx8MTc3NTUxMzI4NXww&ixlib=rb-4.1.0&q=85",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Sour & Wild Ale Collection", "region": "Colorado & Vermont",
             "description": "Four barrel-aged sours and wild ales from America's most innovative craft breweries. Funky, complex, and unforgettable.",
             "price": 85.00, "category": "craft_beer",
             "image_url": "https://images.unsplash.com/photo-1766589220939-cf88e4a655cc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwyfHxjcmFmdCUyMGJlZXIlMjB0YXN0aW5nJTIwZGFyayUyMG1vb2R5fGVufDB8fHx8MTc3NTUxMzI4NXww&ixlib=rb-4.1.0&q=85",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Rosé All Day Sampler", "region": "Provence, France",
             "description": "Four stunning Provence rosés perfect for sharing. Light, crisp, and absolutely social.",
             "price": 95.00, "category": "wine",
             "image_url": "https://images.pexels.com/photos/8775199/pexels-photo-8775199.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
             "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.tasting_kits.insert_many(kits)

    # Seed events
    if await db.events.count_documents({}) == 0:
        events = [
            {"id": str(uuid.uuid4()), "title": "Wine & Craft Beer Social Night", "description": "The ultimate crossover event — sommelier meets brewmaster. Compare tannins with hop profiles in this lively social tasting.",
             "venue": "The Fox Den", "location": "Charlottesville, VA", "date": "2026-02-15", "time": "6:00 PM - 9:00 PM EST",
             "price": 45.00, "format": "In Person", "seats_total": 60, "seats_remaining": 18,
             "image_url": "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwzfHx3aW5lJTIwdGFzdGluZyUyMHNvY2lhbCUyMGdhdGhlcmluZyUyMGZyaWVuZHN8ZW58MHx8fHwxNzc1NTEzMjg1fDA&ixlib=rb-4.1.0&q=85",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "title": "IPA Throwdown: East vs West", "description": "Blind taste test pitting East Coast hazies against West Coast bitters. Bring your friends and pick a side!",
             "venue": "Brew & Vine Taproom", "location": "Portland, OR", "date": "2026-02-22", "time": "7:00 PM - 10:00 PM PST",
             "price": 35.00, "format": "In Person", "seats_total": 80, "seats_remaining": 34,
             "image_url": "https://images.unsplash.com/photo-1766589220911-74584516c516?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwxfHxjcmFmdCUyMGJlZXIlMjB0YXN0aW5nJTIwZGFyayUyMG1vb2R5fGVufDB8fHx8MTc3NTUxMzI4NXww&ixlib=rb-4.1.0&q=85",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "title": "Natural Wine Pop-Up Party", "description": "Join winemakers from 5 natural wine producers for an intimate tasting with live acoustic music and artisan cheese.",
             "venue": "The Cellar Social", "location": "Brooklyn, NY", "date": "2026-03-05", "time": "5:00 PM - 8:00 PM EST",
             "price": 55.00, "format": "In Person", "seats_total": 40, "seats_remaining": 12,
             "image_url": "https://images.unsplash.com/photo-1774684047298-193cd2f986d9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwxfHx3aW5lJTIwdGFzdGluZyUyMHNvY2lhbCUyMGdhdGhlcmluZyUyMGZyaWVuZHN8ZW58MHx8fHwxNzc1NTEzMjg1fDA&ixlib=rb-4.1.0&q=85",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "title": "Stout & Chocolate Pairing Night", "description": "Imperial stouts meet artisan chocolate in this indulgent pairing experience. A perfect date night or friend hangout!",
             "venue": "Foxhound Lounge", "location": "Austin, TX", "date": "2026-03-15", "time": "7:00 PM - 9:30 PM CST",
             "price": 50.00, "format": "In Person", "seats_total": 30, "seats_remaining": 8,
             "image_url": "https://images.unsplash.com/photo-1766589221620-1a36963db1bd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwzfHxjcmFmdCUyMGJlZXIlMjB0YXN0aW5nJTIwZGFyayUyMG1vb2R5fGVufDB8fHx8MTc3NTUxMzI4NXww&ixlib=rb-4.1.0&q=85",
             "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "title": "Virtual: Rosé & Lager Summer Preview", "description": "Taste along from home! We'll ship the kit, you bring the vibes. Live-hosted with group chat and prizes.",
             "venue": "Foxhounds Online", "location": "Virtual", "date": "2026-03-20", "time": "8:00 PM - 9:30 PM EST",
             "price": 30.00, "format": "Virtual", "seats_total": 200, "seats_remaining": 156,
             "image_url": "https://images.unsplash.com/photo-1770453572726-f51592710ca6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwyfHx3aW5lJTIwdGFzdGluZyUyMHNvY2lhbCUyMGdhdGhlcmluZyUyMGZyaWVuZHN8ZW58MHx8fHwxNzc1NTEzMjg1fDA&ixlib=rb-4.1.0&q=85",
             "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.events.insert_many(events)

    # Seed packs
    if await db.packs.count_documents({}) == 0:
        packs = [
            {"id": str(uuid.uuid4()), "name": "The Charlottesville Foxes", "emoji": "fox", "location": "Charlottesville, VA",
             "member_count": 42, "format": "In-Person + Virtual", "tags": ["Wine Bars", "Craft Breweries", "Monthly Socials"],
             "description": "The OG pack. Weekly meetups at local wine bars and craft breweries. New members always welcome — just bring good vibes.",
             "members": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Brooklyn Hops & Grapes", "emoji": "beer", "location": "Brooklyn, NY",
             "member_count": 67, "format": "In-Person", "tags": ["Natural Wine", "IPAs", "Rooftop Parties"],
             "description": "Brooklyn's best beer and wine crew. Rooftop tastings in summer, cozy bar crawls in winter. Very social, slightly wild.",
             "members": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "ATX Pour House", "emoji": "wine", "location": "Austin, TX",
             "member_count": 31, "format": "Hybrid", "tags": ["Patio Sessions", "Live Music", "Texas Wines"],
             "description": "Wine and craft beer lovers in the ATX. Patio tastings, live music nights, and collaborations with local breweries.",
             "members": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "PNW Craft Collective", "emoji": "hop", "location": "Portland, OR",
             "member_count": 53, "format": "In-Person", "tags": ["Brewery Tours", "Pinot Noir", "Taproom Crawls"],
             "description": "Pacific Northwest craft beer and Willamette Valley wine enthusiasts. Monthly brewery tours and winery visits.",
             "members": [], "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Virtual Foxhounds", "emoji": "globe", "location": "Everywhere",
             "member_count": 89, "format": "Virtual Only", "tags": ["Zoom Tastings", "Ship-to-Home", "Global Friends"],
             "description": "Can't make it in person? No problem. We ship the drinks, you join the Zoom. Global community, zero boundaries.",
             "members": [], "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.packs.insert_many(packs)

    # Seed social check-ins
    if await db.checkins.count_documents({}) == 0:
        checkins = [
            {"id": str(uuid.uuid4()), "venue_name": "The Fox Den", "drink_name": "Hazy Little Thing IPA",
             "category": "craft_beer", "rating": 4, "note": "Perfect haze, tropical vibes. This is my new go-to!",
             "user_id": "seed", "user_name": "Sarah K.", "likes": [], "likes_count": 12,
             "created_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()},
            {"id": str(uuid.uuid4()), "venue_name": "Brew & Vine Taproom", "drink_name": "2021 Willamette Pinot Noir",
             "category": "wine", "rating": 5, "note": "Silky smooth, cherry and earth. Paired perfectly with the charcuterie board.",
             "user_id": "seed", "user_name": "Marcus T.", "likes": [], "likes_count": 8,
             "created_at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat()},
            {"id": str(uuid.uuid4()), "venue_name": "Foxhound Lounge", "drink_name": "Barrel-Aged Imperial Stout",
             "category": "craft_beer", "rating": 5, "note": "Absolute banger. Chocolate, vanilla, bourbon oak. 13% and dangerous.",
             "user_id": "seed", "user_name": "Jules W.", "likes": [], "likes_count": 23,
             "created_at": (datetime.now(timezone.utc) - timedelta(hours=8)).isoformat()},
            {"id": str(uuid.uuid4()), "venue_name": "The Cellar Social", "drink_name": "Rosé from Provence",
             "category": "wine", "rating": 4, "note": "Light, crisp, and absolutely perfect for the patio. Friends loved it too!",
             "user_id": "seed", "user_name": "Ava P.", "likes": [], "likes_count": 15,
             "created_at": (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat()},
            {"id": str(uuid.uuid4()), "venue_name": "Brooklyn Beer Garden", "drink_name": "Pliny the Elder Double IPA",
             "category": "craft_beer", "rating": 5, "note": "Finally got my hands on one. Lives up to the hype. Cheers to the pack!",
             "user_id": "seed", "user_name": "Diego R.", "likes": [], "likes_count": 31,
             "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()},
        ]
        await db.checkins.insert_many(checkins)

# ============== ROOT / HEALTH ==============

@api_router.get("/")
async def root():
    return {"message": "Foxhounds Wine & Craft Beer Social API", "status": "operational"}

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
    logger.info("Foxhounds Wine & Craft Beer Social API started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
