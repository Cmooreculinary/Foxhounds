# Vine & Barrel — PRD

## Original Problem Statement
Build Vine & Barrel operational — a premium wine & spirits tasting platform. Set up Stripe for billing. HTML prototype provided as reference.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Radix UI + Lucide icons
- **Backend**: FastAPI (Python) 
- **Database**: MongoDB (Motor async driver)
- **Payments**: Stripe via emergentintegrations library
- **Auth**: JWT with httpOnly cookies + bcrypt password hashing

## User Personas
1. **Enthusiast** (Customer) — browses kits, events, packs, joins community
2. **Admin** — manages all content, views analytics, handles partner inquiries
3. **Partner/Vintner** — submits partnership inquiry via BizDev form

## Core Requirements (Static)
- Dark luxury aesthetic (Playfair Display + Manrope fonts, gold #d4af37 accents, obsidian #0a0a0a background)
- Tasting kits displayed with ordering info (negotiated through distributors)
- Events/reservations handled by venues (info display only)
- Stripe membership subscriptions (Enthusiast $9.99/mo, Connoisseur $24.99/mo, Sommelier $199.99/yr)
- JWT authentication with admin seeding
- Foxhound Packs community groups
- Personal tasting journal
- Partner inquiry form
- Admin panel with full CRUD + analytics

## What's Been Implemented (March 28, 2026)
- [x] Full backend API (14+ endpoints) — auth, kits, events, packs, journal, partner inquiries, membership/Stripe, admin stats
- [x] JWT auth with register, login, logout, refresh, brute force protection
- [x] Stripe checkout integration with payment_transactions collection
- [x] Seed data: 4 kits, 4 events, 4 packs, admin user
- [x] Home page: hero, featured kits, upcoming events, packs preview, coming soon, CTA
- [x] Events page with filter tabs
- [x] Packs page with join functionality
- [x] Profile page with tasting journal CRUD
- [x] BizDev partner inquiry form
- [x] Admin panel: overview stats, events CRUD, kits CRUD, partner inquiries, members list
- [x] Membership page with 3 plans + Stripe checkout
- [x] Glassmorphism header, responsive nav, footer
- [x] Coming Soon placeholders (Live Room, Scanner)
- [x] Full E2E testing: 100% backend, 95% frontend

## Prioritized Backlog
### P0 (Critical)
- None remaining

### P1 (Important)
- Live Tasting Room real-time streaming + chat (WebSocket)
- Bottle Scanner with AI label recognition
- Email notifications for events/membership
- Password reset flow (forgot-password endpoint exists, needs email)

### P2 (Nice to Have)
- Pack chat functionality
- User-to-user connections/following
- Event seat booking with waitlist
- Advanced analytics dashboard
- Search & filtering across kits/events
- Mobile PWA support

## Next Tasks
1. Implement real-time pack chat (WebSocket)
2. Add event booking/reservation tracking
3. Email integration for membership confirmation
4. Expand admin analytics with charts
