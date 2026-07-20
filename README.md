# JalSetu

**Agentic AI Water Delivery Platform for India**

JalSetu (meaning "Water Bridge") is a full-stack platform that digitizes India's water tanker economy. It connects **residents** who need water, **community coordinators** who organize group orders, **drivers** who deliver, and **tanker owners** who manage fleets — all through a single platform powered by AI.

India faces an acute water crisis, especially during summer heatwaves. Most households rely on private water tankers that are overpriced, inconsistent in volume, and lack digital tracking. JalSetu solves this by bringing transparency, automation, and AI verification to the entire delivery lifecycle.

---

## How It Works

### The Problem
- Residents have no way to verify if the tanker delivered the promised volume
- Prices are opaque and vary wildly across wards
- No tracking of deliveries, payments, or disputes
- During heatwaves, demand spikes and supply gets chaotic

### The Solution
1. **Resident books water** from the marketplace, choosing a tanker by price, rating, and capacity
2. **Coordinator organizes** community bookings to get better rates and split bills
3. **Owner assigns a driver** and tanker to the booking
4. **Driver delivers water** and takes before/after photos of the tanker hatch
5. **AI (Gemini Vision) verifies volume** — compares fill levels before and after pumping
6. **If volume is short by >10%**: System automatically raises a dispute, notifies coordinator and resident, driver cannot override
7. **If confirmed**: Driver completes delivery, receipt is generated, payment is released
8. **Resident tracks everything** via GPS, receipts, and real-time status updates

---

## System Architecture

### High-Level Design

![JalSetu HLD](test-pictures/final_hdl.png)

### Database Schema (Supabase / PostgreSQL)

![Supabase Schema](test-pictures/supabase-schema-axyloykvhwymcomqztsd.png)

### Data Flow Summary

```
Resident / Coordinator          Owner               Driver
       |                         |                    |
       |  Book Water             |                    |
       |------------------------>|                    |
       |                         |  Assign Driver     |
       |                         |------------------->|
       |                         |                    |
       |  Track via GPS          |  GPS Updates       |
       |<--------------------------------------------|
       |                         |                    |
       |                         |    Take Photos     |
       |                         |    (Before/After)  |
       |                         |<-------------------|
       |                         |                    |
       |              CV Volume Verification (AI)     |
       |              Gemini Vision analyzes fill %   |
       |<--------------------------------------------|
       |                         |                    |
       |  Receipt Generated      |  Payment Released  |
       |<--------------------------------------------|
```

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js (App Router) | 14.2.35 | SSR + API routes in one framework |
| Language | TypeScript | ^5 | Type safety across full stack |
| Database | Supabase (PostgreSQL + Auth + Realtime) | ^2.110.7 | Auth, DB, realtime subscriptions, RLS |
| AI Text | Groq (llama-3.3-70b-versatile) | - | Fast inference for text-based AI features |
| AI Vision | Google Gemini (gemini-3.1-flash-lite) | ^0.24.1 | Camera-based volume verification |
| Payments | Razorpay (UPI, Cards, Netbanking) | - | India-standard payment gateway |
| Styling | Tailwind CSS | ^3.4.1 | Utility-first CSS for rapid UI |
| Animations | Framer Motion | ^12.42.2 | Smooth page transitions |
| Maps | Leaflet + React-Leaflet | ^1.9.4 | Free, open-source GPS tracking |
| Deployment | Vercel | - | Zero-config Next.js hosting |

---

## Features by Role

### Resident (the water buyer)
- **Marketplace**: Browse all available tankers — see price per liter, capacity, ratings, distance from your ward
- **Booking**: Book water for yourself or start a community group booking
- **Community Bookings**: Join a neighbor's group order to get bulk rates and split the bill automatically
- **GPS Tracking**: Watch your tanker approach in real-time on a Leaflet map, just like tracking a cab
- **CV Volume Verification**: AI analyzes camera photos of the tanker hatch to confirm the actual volume delivered
- **Payments**: Pay via UPI, cash, or subsidy points
- **Receipts**: Automatic digital receipts for every delivery
- **Heatwave Alerts**: Receive alerts when your ward hits extreme temperatures
- **Nudges**: Smart reminders when you might be running low on water based on your usage patterns

### Coordinator (the ward administrator)
- **Community Booking Management**: Create and manage group bookings for your ward
- **Resident Management**: See all residents in your ward, invite them to group orders
- **Dispatch Tankers**: Assign and dispatch tankers for community orders
- **Anomaly Monitoring**: Get instant alerts when price gouging or short deliveries are detected
- **Heatwave Response**: View AI-generated advisories for your ward during heatwaves
- **History**: Full booking and delivery history with status tracking

### Driver (the tanker operator)
- **Active Deliveries**: View your assigned bookings with before/after delivery status
- **Status Updates**: Update delivery status in real-time: En Route > Arrived > Loading > Delivering > Delivered
- **CV Scan**: Take before/after photos of the tanker hatch — AI automatically verifies volume
- **GPS Tracking**: Automatic location sharing so residents can track your approach
- **Delivery History**: Full log of all past deliveries with volume and payment details

### Owner (the tanker business)
- **Fleet Dashboard**: See all your tankers, their current status, and assigned drivers
- **Booking Management**: View incoming booking requests, assign drivers
- **Earnings**: Track revenue, completed deliveries, and average earnings per tanker
- **Demand Forecast**: AI predicts water demand for each ward over the next 7 days — helps you position tankers strategically
- **Reviews**: Monitor driver and tanker ratings from residents
- **Anomaly Alerts**: Get notified of any disputes or flagged deliveries

---

## AI Features

JalSetu uses two AI backends working together:

| AI Backend | Model | Used For |
|------------|-------|----------|
| **Groq** | llama-3.3-70b-versatile | Text tasks: demand forecasting, anomaly detection, tanker ranking, nudge generation, heatwave advisories |
| **Google Gemini** | gemini-3.1-flash-lite | Vision tasks: analyzing tanker photos to estimate water fill levels |

AI wrapper lives in `lib/gemini.ts` — unified interface with retry and exponential backoff for both Groq and Gemini APIs.

---

### Agent 1: CV Volume Verification (Gemini Vision)

**Endpoint:** `POST /api/ai/cv-volume`
**Role:** Driver, Coordinator
**Model:** Gemini 3.1-flash-lite (vision)

Uses computer vision to verify how much water was actually delivered by analyzing photos of the tanker hatch.

**Flow:**
1. Driver takes BEFORE photo (top-down through tanker hatch)
2. Pumps water to customer's tank
3. Takes AFTER photo (same angle)
4. Both photos compressed client-side (max 1024px, JPEG 70%)
5. Sent to `/api/ai/cv-volume` as FormData
6. Server sends both images to Gemini Vision API with fill-estimation prompts
7. AI returns fill percentage for each photo
8. Volume delivered = (before% - after%) x tank_capacity
9. Compared against volume_ordered:
   - Within 10%: **confirmed** — Driver can complete delivery
   - Over 10% short: **short** — System auto-raises dispute
   - Over 10% excess: **excess** — Flagged for review
10. If disputed: coordinator and resident notified via nudge_log, driver cannot override

**Input:** `{ before_image, after_image, volume_ordered, tank_capacity }`
**Output:** `{ verdict, estimated_liters, discrepancy_percent, confidence, before_fill_percent, after_fill_percent }`

---

### Agent 2: AI Tanker Ranking (Groq)

**Endpoint:** `POST /api/ai/rank-tankers`
**Role:** Resident (marketplace)
**Model:** Groq llama-3.3-70b-versatile

Ranks available tankers for a specific ward based on multiple factors, so residents can make informed choices.

**Flow:**
1. Resident searches the marketplace for their ward
2. System fetches all available tankers and recent district booking prices from Supabase
3. Calculates haversine distance from each tanker to the resident's location
4. Sends tanker details + district average price to Groq
5. AI scores each tanker 0-100 based on: price vs. district average, rating, delivery count, distance, and certification
6. Returns ranked list with a short reason (max 8 words) for each ranking

**Input:** `{ ward_id, volume_needed, user_lat, user_lng }`
**Output:** `{ tankers: [{ id, ai_rank_score, ai_rank_reason, ...tanker_details }] }`

---

### Agent 3: Price Gouging Anomaly Detection (Groq)

**Endpoint:** `POST /api/ai/anomaly-check`
**Role:** Coordinator, Owner (monitoring)
**Model:** Groq llama-3.3-70b-versatile

Detects when a tanker is charging significantly more than the district average and protects residents from price gouging during peak demand.

**Flow:**
1. Triggered when a booking is created or reviewed
2. System calculates how far the booking price is above the ward average
3. If >20% above average, sends price data to Groq
4. AI evaluates whether the premium is justified (summer premiums of 20-30% are considered legitimate)
5. Only flags prices >40% above average as anomalies
6. If flagged: logs the anomaly, updates booking with `anomaly_flagged: true`, notifies coordinator

**Input:** `{ booking_id, tanker_id, ward_id, price_per_liter }`
**Output:** `{ is_anomaly, percent_above, reason (max 12 words), severity: "low"|"medium"|"high" }`

---

### Agent 4: Ward Demand Forecasting (Groq)

**Endpoint:** `POST /api/ai/demand-forecast`
**Role:** Owner (fleet planning)
**Model:** Groq llama-3.3-70b-versatile

Predicts water demand for each ward over the next 7 days so tanker owners can position their fleet strategically.

**Flow:**
1. Owner opens the demand forecast dashboard
2. System fetches all wards, last 30 days of bookings, and active heatwave alerts
3. Aggregates per ward stats: pending bookings, total delivered, average price, heatwave status
4. Sends aggregated data to Groq
5. AI analyzes patterns (e.g., heatwave = higher demand, low recent deliveries = unmet need)
6. Returns demand scores (0-100) and predictions for each ward with reasoning

**Input:** None (auto-fetches from database)
**Output:** `{ forecast: [{ ward_id, ward_name, current_demand_score, predicted_demand_tomorrow, pending_bookings, avg_price_paid, reasoning }] }`

---

### Agent 5: Heatwave Advisory Generator (Groq)

**Endpoint:** `POST /api/ai/heatwave-advisory`
**Role:** All users (safety information)
**Model:** Groq llama-3.3-70b-versatile

Generates plain-language heatwave safety advisories tailored to the current weather conditions. Written at a Class 5 reading level so everyone can understand.

**Flow:**
1. Called by the heatwave-check cron job when temperature >= 40 degrees C
2. Sends current temperature, humidity, district, and state to Groq
3. AI generates: severity tier (watch/warning/emergency), 2-sentence advisory, 3 do-items, 2 don't-items, and best outdoor time window
4. Advisory is stored in the `heatwave_alerts` table
5. Displayed to all users in the affected ward via the HeatwaveAlert banner

**Input:** `{ temperature, feels_like, humidity, district, state }`
**Output:** `{ severity: "watch"|"warning"|"emergency", advisory_english, do_list: [3], dont_list: [2], best_time_outdoors }`

---

### Agent 6: Predictive Re-engagement Nudges (Groq)

**Endpoint:** `POST /api/ai/predictive-nudge`
**Role:** Resident engagement (retention)
**Model:** Groq llama-3.3-70b-versatile

Generates personalized messages to re-engage residents who haven't booked water recently — helps prevent water emergencies.

**Flow:**
1. System identifies inactive residents in a ward (no booking in 6+ days, or never ordered)
2. Checks if there is an active heatwave and its severity
3. Sends resident details + heatwave context to Groq
4. AI generates personalized nudge for each resident (e.g., "You last ordered 8 days ago. A heatwave is active in your area. Your tank may be running low.")
5. Nudges are displayed to residents when they open the app

**Input:** `{ ward_id }`
**Output:** `{ nudges: [{ user_id, message, urgency: "low"|"medium"|"high" }] }`


---

## Multi-Ward System

JalSetu is designed for city-scale deployment with ward-based organization:

- Each resident and coordinator is registered to a specific ward
- Bookings, tankers, and demand forecasts are ward-scoped
- Coordinators manage community bookings only within their ward
- AI demand forecasts predict water needs per ward
- Heatwave alerts are ward-specific
- **6 Jaipur wards seeded**: Mansarovar (Ward 12), Vaishali Nagar (Ward 8), Malviya Nagar (Ward 15), Civil Lines (Ward 3), Tonk Road (Ward 20), Jagatpura (Ward 25)

---

## Setup

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works) — provides PostgreSQL database + authentication
- Groq API key (free tier) — for text-based AI features
- Google AI API key (free tier) — for vision-based CV scan
- Razorpay account (optional) — for payment processing

### 1. Clone and Install

```bash
git clone https://github.com/meenakshikr/meesho_jalSetu.git
cd jalsetu
npm install
```

### 2. Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase (from your Supabase project dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI — Groq (from console.groq.com)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx

# AI — Google Gemini (from aistudio.google.com)
GOOGLE_AI_API_KEY=AIzaSyxxxxxxxxxxxxxxx

# Razorpay (optional — from dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron secret (for scheduled tasks)
CRON_SECRET=any-random-string
```

### 3. Seed Demo Data

This populates your Supabase database with realistic test data:

```bash
npx tsx scripts/seed-data.ts
```

What gets created:
- **6 Jaipur wards** with names and ward numbers
- **4 tankers** across 2 owners (7500L to 11000L capacity)
- **10 users**: 3 residents (different wards), 4 drivers, 1 coordinator, 2 owners
- **25+ delivered bookings** with GPS coordinates across all wards
- **18+ reviews** for tankers
- **4 active bookings** (one per driver, in various stages)
- **Driver GPS locations** for live tracking
- **Active heatwave alert** for Jaipur (43.5 degrees C)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Test Accounts (password: `password123`)

| Account | Role | Ward | What to Test |
|---------|------|------|-------------|
| `resident1@test.com` | Resident | Vaishali Nagar Ward 8 | Heatwave banner, nudge card, marketplace with AI ranking, book City Water Co to trigger anomaly |
| `resident2@test.com` | Resident | Mansarovar Ward 12 | Community booking join flow |
| `resident3@test.com` | Resident | Civil Lines Ward 3 | Different ward perspective |
| `coordinator@test.com` | Coordinator | Mansarovar Ward 12 | Create community booking, see residents join in real time |
| `driver@test.com` | Driver | - | Active delivery, CV tank scan, confirm delivery |
| `driver2@test.com` | Driver | - | Additional deliveries |
| `driver3@test.com` | Driver | - | Active delivery to Civil Lines, dispatched status |
| `driver4@test.com` | Driver | - | Active delivery to Jagatpura, confirmed status |
| `owner@test.com` | Owner | - | Fleet dashboard, demand forecast heatmap |
| `owner2@test.com` | Owner | - | Second owner perspective |

### User Guide

Follow this sequence to see features working live:

**Step 1 — Login as `resident@test.com`**

The home screen immediately shows the heatwave alert banner (seeded as active) and the predictive nudge card saying water is running low. Both are AI-generated. No human set these up.

**Step 2 — Tap Book Water > Tanker Marketplace**

Three tankers load sorted by AI rank score. Each card shows a teal callout with the AI's one-line reason for the ranking. City Water Co appears at the bottom ranked lowest because it is 177% above the district average price.

**Step 3 — Select City Water Co and confirm booking**

Within 3-5 seconds, a red "Price Alert Detected" banner appears on the booking screen. The anomaly agent fired automatically in the background after the booking was created.

**Step 4 — Login as `coordinator@test.com`**

Create a community booking. Open a second browser tab logged in as `resident2@test.com` and join the booking. Watch the participant count update in real time on the coordinator screen without refreshing.

**Step 5 — Login as `driver@test.com`**

Open an active delivery. Tap Scan Tank. Take a before photo of any circular opening. Deliver. Take an after photo. Tap Verify Volume. The CV result appears showing before and after fill percentages and estimated liters delivered.

**Step 6 — Login as `owner@test.com`**

Go to Demand Forecast. The AI has analyzed all ward booking patterns and heatwave data and predicted which wards will have highest demand tomorrow. Wards are ranked with color-coded bars.

---

## Project Structure

```
jalsetu/
├── app/
│   ├── (auth)/                 # Login and register pages
│   │   ├── login/
│   │   └── register/
│   ├── api/
│   │   ├── ai/                 # AI-powered endpoints (6 total)
│   │   │   ├── anomaly-check/  # Price gouging detection
│   │   │   ├── cv-volume/      # Camera volume verification
│   │   │   ├── demand-forecast/# Ward-level demand prediction
│   │   │   ├── heatwave-advisory/ # Safety advisories
│   │   │   ├── predictive-nudge/  # Re-engagement messages
│   │   │   └── rank-tankers/   # AI tanker recommendations
│   │   ├── auth/               # Login, logout, register, current user
│   │   ├── bookings/           # Booking CRUD, detail, join endpoint
│   │   ├── community-bookings/ # Community booking queries
│   │   ├── cron/               # Scheduled tasks (heatwave, nudges)
│   │   ├── driver/             # Driver bookings, tankers, GPS location
│   │   ├── heatwave/           # Heatwave alert queries
│   │   ├── nudges/             # Nudge log retrieval and read
│   │   ├── owner/              # Fleet, bookings, assign driver, stats
│   │   ├── payments/           # Razorpay orders, webhooks, cash marking
│   │   ├── receipts/           # Receipt generation and retrieval
│   │   ├── reviews/            # Tanker reviews
│   │   ├── tankers/            # Tanker CRUD
│   │   ├── users/              # User listing
│   │   └── wards/              # Ward listing
│   ├── coordinator/            # Coordinator pages
│   │   ├── anomaly/[id]/       # Anomaly detail
│   │   ├── assign/[id]/        # Driver assignment
│   │   ├── booking/[id]/       # Booking detail
│   │   ├── create/             # Create community booking
│   │   ├── delivery/[id]/      # Delivery tracking
│   │   ├── history/            # Booking history
│   │   └── nudges/             # Nudge management
│   ├── driver/                 # Driver pages
│   │   ├── confirm/[id]/       # Confirm delivery with CV
│   │   ├── delivery/[id]/      # Delivery progress
│   │   └── history/            # Delivery history
│   ├── owner/                  # Owner pages
│   │   ├── bookings/           # Booking management
│   │   ├── demand/             # Demand forecast
│   │   ├── fleet/              # Fleet management
│   │   └── reviews/            # Tanker reviews
│   └── resident/               # Resident pages
│       ├── booking/[id]/       # Booking detail
│       ├── community/          # Community bookings
│       ├── delivery/[id]/      # Delivery tracking
│       ├── marketplace/        # Tanker marketplace
│       ├── payment/[id]/       # Payment flow
│       └── tracking/[id]/      # Live GPS tracking
├── components/                 # Reusable UI components
│   ├── BillSplit.tsx           # Community bill splitting
│   ├── BookingStatus.tsx       # Booking status tracker
│   ├── BottomNav.tsx           # Mobile bottom navigation
│   ├── CVScanner.tsx           # Camera volume verification
│   ├── HeatwaveAlert.tsx       # Heatwave alert banner
│   ├── LoadingBar.tsx          # Top loading progress bar
│   ├── MapView.tsx             # Leaflet map with routes and markers
│   ├── ReceiptCard.tsx         # Receipt display
│   ├── TankerCard.tsx          # Tanker info card
│   └── ui/                     # shadcn/ui primitives
├── contexts/
│   └── ThemeContext.tsx         # Theme provider context
├── hooks/
│   ├── useBooking.ts           # Booking state hook
│   ├── useHeatwave.ts          # Heatwave alert hook
│   └── useLocation.ts          # GPS location hook
├── lib/
│   ├── compress-image.ts       # Client-side image compression for CV scan
│   ├── gemini.ts               # Groq (text) + Gemini (vision) AI wrapper
│   ├── geocode.ts              # Nominatim geocoding utility
│   ├── razorpay.ts             # Razorpay client
│   ├── supabase-client.ts      # Browser Supabase client
│   ├── supabase-server.ts      # Server + service role Supabase clients
│   └── utils.ts                # INR formatting, haversine distance, etc.
├── scripts/
│   ├── seed-data.ts            # Main seed script
│   └── seed-jaipur.js          # Extended Jaipur seed data
├── supabase/
│   └── migrations/             # SQL migrations
├── test-pictures/              # HLD diagrams and test images
├── types/
│   └── index.ts                # TypeScript type definitions
├── middleware.ts                # Next.js middleware (auth + routing)
└── vercel.json                 # Vercel deployment config + cron schedules
```

---

## API Routes

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (ward required for resident/coordinator) |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current user profile with ward |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | List bookings (filterable by ward, status, type, resident) |
| POST | `/api/bookings` | Create a new booking (auto-geocodes address) |
| GET | `/api/bookings/[id]` | Get booking details with tanker, driver, participants |
| PATCH | `/api/bookings/[id]` | Update booking status, assign driver. Auto-generates receipts on delivery. Auto-raises disputes and notifies coordinator + resident on short delivery. |
| POST | `/api/bookings/[id]/join` | Join a community booking |

### Driver
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/driver/bookings` | Get bookings for the authenticated driver |
| GET | `/api/driver/tankers` | Get tankers assigned to the authenticated driver |
| POST | `/api/driver/location` | Submit GPS location for live tracking |
| GET | `/api/driver/location/[driverId]` | Get driver GPS location and history |

### Owner
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/owner/bookings` | Owner bookings across fleet |
| PATCH | `/api/owner/bookings/[id]/assign` | Assign driver to booking |
| GET | `/api/owner/fleet` | Fleet overview with tanker and driver stats |
| GET | `/api/owner/stats` | Earnings and delivery statistics |

### Tankers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tankers` | List tankers (filterable by ward, owner) |
| POST | `/api/tankers` | Add a new tanker |
| GET | `/api/tankers/[id]` | Get tanker details with reviews |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Create Razorpay order |
| POST | `/api/payments/webhook` | Razorpay webhook handler |
| POST | `/api/payments/[id]/cash` | Mark cash payment as received |

### Receipts and Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/receipts` | List receipts for current user |
| GET | `/api/receipts/[id]` | Get receipt details |
| POST | `/api/reviews` | Submit a tanker review with rating |
| GET | `/api/reviews/tanker/[id]` | Get reviews for a specific tanker |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/rank-tankers` | AI-ranked tanker recommendations for a ward |
| POST | `/api/ai/anomaly-check` | Price/volume anomaly detection |
| POST | `/api/ai/cv-volume` | Computer vision volume verification from photos |
| POST | `/api/ai/heatwave-advisory` | Heatwave advisory generation |
| POST | `/api/ai/demand-forecast` | Ward-level 7-day demand prediction |
| POST | `/api/ai/predictive-nudge` | Personalized re-engagement nudges |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wards` | List all wards |
| GET | `/api/heatwave` | Get active heatwave alerts |
| GET | `/api/nudges` | Get user unread nudges |
| PATCH | `/api/nudges/[id]/read` | Mark nudge as read |
| GET | `/api/users` | List users (filterable by role) |
| GET | `/api/community-bookings` | List community bookings |
| GET | `/api/cron/heatwave-check` | Scheduled heatwave monitoring (daily) |
| GET | `/api/cron/coordinator-nudge` | Scheduled nudge dispatch (daily) |

---

## Deployment

### Vercel (Production)

1. Push to GitHub
2. Import project on Vercel
3. Add environment variables in Vercel Dashboard > Settings > Environment Variables
4. Deploy — Vercel auto-deploys on every push to main
5. Disable Vercel Authentication in Deployment Protection settings so anyone with the link can access


---

## License

MIT
