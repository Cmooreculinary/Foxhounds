# Foxhounds Wine & Craft Beer Social — PRD

## Original Problem Statement
Rebrand "Vine & Barrel" to "Foxhounds Wine & Craft Beer Social". Remove spirits, add craft beer. Highly social platform. Set up Stripe for membership billing. Make the experience excellent.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Lucide icons + DM Sans + Playfair Display fonts
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **Payments**: Stripe via emergentintegrations library
- **Auth**: JWT with httpOnly cookies + bcrypt password hashing

## User Personas
1. **Social Sipper** (Casual) — browses events, check-ins, joins packs, shares drinks
2. **Pack Leader** (Power User) — creates packs, journals extensively, attends events regularly
3. **Admin** — manages all content, views analytics, handles partner inquiries
4. **Partner** (Winery/Brewery/Venue) — submits partnership inquiry via BizDev form

## Core Requirements (Static)
- Dark warm aesthetic (Playfair Display + DM Sans, amber #c9a44a + beer orange #d4883a + wine #7b2332, deep brown bg #0c0a08)
- Fox mascot logo featured prominently
- Wine AND Craft Beer categories (spirits removed)
- Highly social: check-in feed, likes, star ratings, community packs
- Tasting kits: ordering info (negotiated through distributors)
- Events/reservations: handled by venues
- Stripe membership subscriptions: Social Sipper $9.99/mo, Pack Leader $24.99/mo, Foxhound Elite $199.99/yr
- JWT authentication with admin seeding
- Foxhound Packs community groups
- Personal tasting journal + social check-ins
- Partner inquiry form
- Admin panel with full CRUD + analytics

## What's Been Implemented

### Phase 1 (March 28, 2026 — "Vine & Barrel" MVP)
- Full backend API, JWT auth, Stripe checkout, seed data, all screens

### Phase 2 (April 6, 2026 — Foxhounds Rebrand)
- [x] Complete rebrand: "Vine & Barrel" → "Foxhounds Wine & Craft Beer Social"
- [x] Fox mascot logo integrated in header, hero, footer, auth pages, success page
- [x] Spirits removed, craft beer added (3 wine kits + 3 craft beer kits)
- [x] 5 new social events (Wine & Craft Beer Social Night, IPA Throwdown, Natural Wine Pop-Up, Stout & Chocolate Pairing, Virtual Rosé & Lager Preview)
- [x] 5 Foxhound Packs (Charlottesville Foxes, Brooklyn Hops & Grapes, ATX Pour House, PNW Craft Collective, Virtual Foxhounds)
- [x] Social check-in system: POST/GET /api/checkins, POST /api/checkins/{id}/like
- [x] Social feed on home page with check-in cards (avatars, star ratings, likes, venue, wine/beer badges)
- [x] Profile page: Check-in tab + Journal tab with wine/beer category selection
- [x] Membership renamed: Social Sipper, Pack Leader, Foxhound Elite
- [x] Admin dashboard: new check-ins stat, wine/beer icons in kit management
- [x] Warm amber/gold/wine color palette with DM Sans typography
- [x] 5 seeded social check-ins for demo social feed
- [x] 100% backend (17/17) + 100% frontend testing pass rate

## Prioritized Backlog
### P0 (Critical) — None remaining

### P1 (Important)
- Live Tasting Room (WebSocket real-time streaming + chat)
- Label Scanner with AI recognition
- Email notifications for events/membership
- Pack chat functionality (real-time messaging)
- User-to-user friend system (follow/connect)

### P2 (Nice to Have)
- Event booking/reservation tracking
- Photo uploads for check-ins
- Comment threads on check-ins
- Leaderboard / gamification (most check-ins, top rater)
- Advanced admin analytics with charts
- Search & filtering across kits/events
- Mobile PWA support
- Push notifications

## Next Tasks
1. Pack chat (WebSocket real-time messaging)
2. Friend/follow system
3. Photo uploads for check-ins
4. Email integration for membership confirmation
5. Event booking tracking
