# JalSetu

**Agentic AI Water Delivery Platform for India**

JalSetu is a role-based water tanker booking and management platform that connects residents, community coordinators, tanker drivers, and tanker owners through a unified system with AI-powered demand forecasting, anomaly detection, CV volume verification, and heatwave advisories.

Built for Indian cities where water tanker delivery is a critical daily need — especially during heatwave seasons.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.35 |
| Language | TypeScript | ^5 |
| Database | Supabase (PostgreSQL + Auth + Realtime) | ^2.110.7 |
| AI Text | Groq (llama-3.3-70b-versatile) | — |
| AI Vision | Google Gemini (gemini-3.1-flash-lite) | ^0.24.1 |
| Payments | Razorpay (UPI, Cards, Netbanking) | — |
| Styling | Tailwind CSS | ^3.4.1 |
| Animations | Framer Motion | ^12.42.2 |
| Maps | Leaflet + React-Leaflet | ^1.9.4 |
| Icons | Lucide React | ^1.24.0 |
| UI | shadcn/ui + class-variance-authority | ^0.7.1 |
| Fonts | Geist Sans | ^1.7.2 |

---

## Features by Role

### Resident
- Browse available tankers in marketplace
- Book water for individual or community use
- Join community bookings with bill splitting
- Real-time GPS order tracking with live map
- AI-verified delivery volume via camera (CV scan)
- Payment via UPI, cash, or subsidy points
- View receipts and booking history
- Personalized nudges when water is due
- Heatwave alerts for their ward

### Coordinator
- Create and manage community bookings for their ward
- Invite residents to join group orders
- Dispatch assigned tankers
- View heatwave alerts and AI advisories
- Monitor booking progress with participant tracking
- View booking and delivery history
- Anomaly alerts for price gouging

### Driver
- View assigned deliveries with active/completed tabs
- Update delivery status (en route, arrived, loading, delivering, delivered)
- Confirm delivery with CV volume verification
- GPS location tracking via Leaflet maps
- View delivery history

### Owner
- Fleet dashboard with all tankers and drivers
- View incoming booking requests
- Assign drivers to bookings
- Earnings and fleet statistics
- Demand forecast dashboard for ward-level predictions
- Tanker performance reviews and ratings

---

## AI Features

| Endpoint | Purpose | Model |
|----------|---------|-------|
| `/api/ai/rank-tankers` | Ranks tankers by price, distance, rating, capacity | Groq llama-3.3-70b |
| `/api/ai/anomaly-check` | Detects price gouging vs district averages | Groq llama-3.3-70b |
| `/api/ai/cv-volume` | Computer vision volume verification from photos | Gemini 3.1-flash-lite |
| `/api/ai/heatwave-advisory` | Hinglish heatwave advisories with actions | Groq llama-3.3-70b |
| `/api/ai/demand-forecast` | Ward-level 7-day demand prediction | Groq llama-3.3-70b |
| `/api/ai/predictive-nudge` | Personalized re-engagement messages | Groq llama-3.3-70b |

AI wrapper lives in `lib/gemini.ts` — handles Groq for text tasks, Gemini for vision, with retry and backoff.

---

## Setup

### Prerequisites
- Node.js 18+
- Supabase project (with PostgreSQL database)
- Groq API key (free tier)
- Google AI API key (free tier)
- Razorpay account (optional, for payments)

### 1. Clone and Install

```bash
git clone https://github.com/meenakshikr/meesho_jalSetu.git
cd jalsetu
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI
GROQ_API_KEY=your-groq-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Razorpay (optional)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron
CRON_SECRET=
```

### 3. Seed Demo Data

```bash
npx tsx scripts/seed-data.ts
```

This creates:
- 6 Jaipur wards (Mansarovar, Vaishali Nagar, Malviya Nagar, Civil Lines, Tonk Road, Jagatpura)
- 8 tankers across 2 owners (all 7500L+ capacity)
- 10 users (3 residents across different wards, 4 drivers, 1 coordinator, 2 owners)
- 25+ delivered bookings across all wards with GPS coordinates
- 18+ reviews
- 4 active bookings (one per driver)
- Driver GPS locations
- Active heatwave alert

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Test Accounts (password: `password123`)

| Account | Role | Ward |
|---------|------|------|
| `owner@test.com` | Owner | — |
| `owner2@test.com` | Owner | — |
| `driver@test.com` | Driver | — |
| `driver2@test.com` | Driver | — |
| `driver3@test.com` | Driver | — |
| `driver4@test.com` | Driver | — |
| `coordinator@test.com` | Coordinator | Mansarovar Ward 12 |
| `resident1@test.com` | Resident | Vaishali Nagar Ward 8 |
| `resident2@test.com` | Resident | Mansarovar Ward 12 |
| `resident3@test.com` | Resident | Civil Lines Ward 3 |

---

## Project Structure

```
jalsetu/
├── app/
│   ├── (auth)/                 # Login and register pages
│   │   ├── login/
│   │   └── register/
│   ├── api/
│   │   ├── ai/                 # AI-powered endpoints
│   │   │   ├── anomaly-check/
│   │   │   ├── cv-volume/
│   │   │   ├── demand-forecast/
│   │   │   ├── heatwave-advisory/
│   │   │   ├── predictive-nudge/
│   │   │   └── rank-tankers/
│   │   ├── auth/               # Authentication (login, logout, register, me)
│   │   ├── bookings/           # Booking CRUD, detail, and join endpoint
│   │   ├── community-bookings/ # Community booking queries
│   │   ├── cron/               # Scheduled tasks (heatwave check, coordinator nudge)
│   │   ├── driver/             # Driver-specific APIs (bookings, tankers, GPS location)
│   │   ├── heatwave/           # Heatwave alert queries
│   │   ├── nudges/             # Nudge log retrieval and read
│   │   ├── owner/              # Owner fleet, bookings, assign driver, stats
│   │   ├── payments/           # Payment creation, webhooks, cash marking
│   │   ├── receipts/           # Receipt generation and retrieval
│   │   ├── reviews/            # Tanker reviews
│   │   ├── tankers/            # Tanker CRUD
│   │   ├── users/              # User listing
│   │   └── wards/              # Ward listing
│   ├── coordinator/            # Coordinator dashboard and pages
│   │   ├── anomaly/[id]/       # Anomaly detail
│   │   ├── assign/[id]/        # Driver assignment
│   │   ├── booking/[id]/       # Booking detail
│   │   ├── create/             # Create community booking
│   │   ├── delivery/[id]/      # Delivery tracking
│   │   ├── history/            # Booking history
│   │   └── nudges/             # Nudge management
│   ├── driver/                 # Driver dashboard and delivery flow
│   │   ├── confirm/[id]/       # Confirm delivery with CV
│   │   ├── delivery/[id]/      # Delivery progress
│   │   └── history/            # Delivery history
│   ├── owner/                  # Owner dashboard, fleet, demand
│   │   ├── bookings/           # Booking management
│   │   ├── demand/             # Demand forecast
│   │   ├── fleet/              # Fleet management
│   │   └── reviews/            # Tanker reviews
│   └── resident/               # Resident dashboard, marketplace, tracking
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
│   ├── CVScanner.tsx           # Camera-based volume verification
│   ├── HeatwaveAlert.tsx       # Heatwave alert banner
│   ├── LoadingBar.tsx          # Top loading progress bar
│   ├── MapView.tsx             # Leaflet map with routes and markers
│   ├── ReceiptCard.tsx         # Receipt display
│   ├── TankerCard.tsx          # Tanker info card
│   ├── ThemeToggle.tsx         # Dark/light theme toggle
│   └── ui/                     # shadcn/ui primitives
├── contexts/
│   └── ThemeContext.tsx         # Theme provider context
├── hooks/
│   ├── useBooking.ts           # Booking state hook
│   ├── useHeatwave.ts          # Heatwave alert hook
│   └── useLocation.ts          # GPS location hook
├── lib/
│   ├── gemini.ts               # Groq (text) + Gemini (vision) AI wrapper
│   ├── geocode.ts              # Nominatim geocoding utility
│   ├── razorpay.ts             # Razorpay client
│   ├── supabase-client.ts      # Browser Supabase client
│   ├── supabase-server.ts      # Server + service role Supabase clients
│   └── utils.ts                # Utility functions (INR formatting, haversine, etc.)
├── scripts/
│   ├── seed-data.ts            # Main seed script (wards, users, bookings, reviews)
│   └── seed-jaipur.js          # Extended Jaipur seed data
├── supabase/
│   └── migrations/             # SQL migrations
├── types/
│   └── index.ts                # TypeScript type definitions
├── middleware.ts                # Next.js middleware (auth + routing)
└── vercel.json                 # Vercel deployment config
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
| PATCH | `/api/bookings/[id]` | Update booking status, assign driver |
| POST | `/api/bookings/[id]/join` | Join a community booking |

### Driver
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/driver/bookings` | Get bookings for a driver |
| GET | `/api/driver/tankers` | Get tankers for a driver |
| POST | `/api/driver/location` | Submit GPS location |
| GET | `/api/driver/location/[driverId]` | Get driver GPS location and history |

### Owner
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/owner/bookings` | Owner's bookings |
| PATCH | `/api/owner/bookings/[id]/assign` | Assign driver to booking |
| GET | `/api/owner/fleet` | Owner's fleet overview |
| GET | `/api/owner/stats` | Owner's earnings stats |

### Tankers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tankers` | List tankers |
| POST | `/api/tankers` | Add a new tanker |
| GET | `/api/tankers/[id]` | Get tanker details |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Create Razorpay order |
| POST | `/api/payments/webhook` | Razorpay webhook handler |
| POST | `/api/payments/[id]/cash` | Mark cash payment |

### Receipts & Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/receipts` | List receipts |
| GET | `/api/receipts/[id]` | Get receipt details |
| POST | `/api/reviews` | Submit a tanker review |
| GET | `/api/reviews/tanker/[id]` | Get reviews for a tanker |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/rank-tankers` | AI-ranked tanker recommendations |
| POST | `/api/ai/anomaly-check` | Price/volume anomaly detection |
| POST | `/api/ai/cv-volume` | Computer vision volume verification |
| POST | `/api/ai/heatwave-advisory` | Heatwave advisory generation |
| POST | `/api/ai/demand-forecast` | Ward-level demand prediction |
| POST | `/api/ai/predictive-nudge` | Personalized re-engagement nudges |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wards` | List all wards |
| GET | `/api/heatwave` | Get active heatwave alerts |
| GET | `/api/nudges` | Get user's unread nudges |
| PATCH | `/api/nudges/[id]/read` | Mark nudge as read |
| GET | `/api/users` | List users (filterable by role) |
| GET | `/api/community-bookings` | List community bookings |
| GET | `/api/cron/heatwave-check` | Scheduled heatwave monitoring |
| GET | `/api/cron/coordinator-nudge` | Scheduled nudge dispatch |

---

## Design

- Dark navy (#021B3A) background
- Teal (#0D9488) primary accent
- Rounded-2xl card pattern
- Mobile-first responsive layout
- No emojis, no Hindi in UI text

---

## License

MIT
